// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":recent-browser");

// lovelace card imports.
import { html, PropertyValues, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import { FavBrowserBase } from './fav-browser-base';
import { Section } from '../types/section';
import { MediaPlayer } from '../model/media-player';
import { formatTitleInfo } from '../utils/media-browser-utils';
import { getHomeAssistantErrorMessage, getUtcNowTimestamp } from '../utils/utils';
import { IRecent } from '../types/soundtouchplus/recent';


@customElement("stpc-recent-browser")
export class RecentBrowser extends FavBrowserBase {

  /** Array of items to display in the media list. */
  protected override mediaList!: Array<IRecent> | undefined;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super(Section.RECENTS);
    this.filterCriteriaPlaceholder = "filter by name or source";
    this.isActionsEnabled = false;

  }


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // invoke base class method.
    super.render();

    // filter items.
    const filterName = (this.filterCriteria || "").toLocaleLowerCase();
    const filteredItems = this.mediaList?.filter((item: IRecent) => (item.ContentItem?.Name?.toLocaleLowerCase().indexOf(filterName) !== -1) || (item.ContentItem?.Source?.toLocaleLowerCase().indexOf(filterName) !== -1));
    this.filterItemCount = filteredItems?.length;

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.recentBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList, filteredItems);
    const subtitle = formatTitleInfo(this.config.recentBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList, filteredItems);

    // render html.
    return html`
      <div class="media-browser-section" style=${this.styleMediaBrowser()}>
        ${title ? html`<div class="media-browser-section-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="media-browser-section-subtitle">${subtitle}</div>` : html``}
        <div class="media-browser-controls">
          ${!(this.isActionsVisible || false) ? html`` : html`${this.btnHideActionsHtml}`}
          ${this.filterCriteriaHtml}${this.refreshMediaListHtml}
        </div>
        <div id="mediaBrowserContentElement" class="media-browser-content">
          ${this.alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this.alertErrorClear}>${this.alertError}</ha-alert>` : ""}
          ${this.alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this.alertInfoClear}>${this.alertInfo}</ha-alert>` : ""}
          ${(() => {
            if (this.config.recentBrowserItemsPerRow === 1) {
              return (
                html`<stpc-media-browser-list
                      class="media-browser-list"
                      .items=${filteredItems}
                      .store=${this.store}
                      @item-selected=${this.onItemSelected}
                      @item-selected-with-hold=${this.onItemSelectedWithHold}
                      ></stpc-media-browser-list>`
              )
            } else {
              return (
                html`<stpc-media-browser-icons
                      class="media-browser-list"
                      .items=${filteredItems}
                      .store=${this.store}
                      @item-selected=${this.onItemSelected}
                      @item-selected-with-hold=${this.onItemSelectedWithHold}
                      ></stpc-media-browser-icons>`
              )
            }
          })()}  
        </div>
      </div>
    `;
  }


  /**
   * Updates the mediaList display.
   */
  protected override updateMediaList(player: MediaPlayer): boolean {

    // invoke base class method; if it returns false, then we should not update the media list.
    if (!super.updateMediaList(player)) {
      return false;
    }

    try {

      // check for conditions that prevent the content from showing.
      if (!this.player.attributes.soundtouchplus_recents_cache_enabled) {
        this.alertInfo = "Recents cache disabled in \"" + this.player.name + "\" configuration.";
        this.isUpdateInProgress = false;
        return true;
      }

      // we use the `Promise.allSettled` approach here like we do with actions, so
      // that we can easily add promises if more data gathering is needed in the future.
      const promiseRequests = new Array<Promise<unknown>>();

      // create promise - get media list.
      const promiseUpdateMediaList = new Promise((resolve, reject) => {

        // call the service to retrieve the media list.
        this.soundTouchPlusService.RecentListCache(player)
          .then(result => {

            // load media list results.
            this.mediaList = result.Recents;
            this.mediaListLastUpdatedOn = result.LastUpdatedOn || getUtcNowTimestamp();

            if (debuglog.enabled) {
              debuglog("%cupdateMediaList - media list updated\n- %s = mediaListLastUpdatedOn\n- %s = soundtouchplus_recents_cache_lastupdated",
                "color: gold;",
                JSON.stringify(this.mediaListLastUpdatedOn),
                JSON.stringify(this.player.attributes.soundtouchplus_recents_cache_lastupdated),
              );
            }

            // call base class method, indicating media list update succeeded.
            super.updatedMediaListOk();

            // resolve the promise.
            resolve(true);

          })
          .catch(error => {

            // clear results, and reject the promise.
            this.mediaList = undefined;
            this.mediaListLastUpdatedOn = 0;

            // call base class method, indicating media list update failed.
            super.updatedMediaListError("Get Recent List Cache failed: " + getHomeAssistantErrorMessage(error));

            // reject the promise.
            reject(error);

          })
      });

      promiseRequests.push(promiseUpdateMediaList);

      // show visual progress indicator.
      this.progressShow();

      // execute all promises, and wait for all of them to settle.
      // we use `finally` logic so we can clear the progress indicator.
      // any exceptions raised should have already been handled in the 
      // individual promise definitions; nothing else to do at this point.
      Promise.allSettled(promiseRequests).finally(() => {

        // clear the progress indicator.
        this.progressHide();

      });

      return true;

    }
    catch (error) {

      // clear the progress indicator.
      this.progressHide();

      // set alert error message.
      super.updatedMediaListError("Recently Played items refresh failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {
    }
  }


  /**
    * Invoked before `update()` to compute values needed during the update.
    *
    * We will check for changes in the media player recent last updated date.
    * If a change is being made, then it denotes the recent list was changed
    * by the physical device (or via the SoundTouch app).  In this case, we
    * will refresh the media list with the changes.
    */
  protected willUpdate(changedProperties: PropertyValues): void {

    // invoke base class method.
    super.willUpdate(changedProperties);

    // get list of changed property keys.
    const changedPropKeys = Array.from(changedProperties.keys())

    //if (debuglog.enabled) {
    //  debuglog("%cwillUpdate - changed property keys:\n",
    //    "color: red;",
    //    JSON.stringify(changedPropKeys),
    //  );
    //}

    // we only care about "store" property changes at this time, as it contains a
    // reference to the "hass" property.  we are looking for background image changes.
    if (!changedPropKeys.includes('store')) {
      return;
    }

    // did the recents list change on the device?
    // if so, then refresh the media list to reflect it.
    if (!this.isUpdateInProgress) {
      if ((this.mediaList) && ((this.mediaListLastUpdatedOn || 0) > 0)) {
        if ((this.player.attributes.soundtouchplus_recents_cache_lastupdated || 0) > (this.mediaListLastUpdatedOn || 0)) {

          if (debuglog.enabled) {
            debuglog("%cwillUpdate - recent cache lastupdated changed; refreshing media list\n- %s = mediaListLastUpdatedOn\n- %s = soundtouchplus_recents_cache_lastupdated",
              "color: gold;",
              JSON.stringify(this.mediaListLastUpdatedOn),
              JSON.stringify(this.player.attributes.soundtouchplus_recents_cache_lastupdated),
            );
          }

          // refresh medialist.
          this.updateMediaList(this.player);

        }
      }
    }
  }

}
