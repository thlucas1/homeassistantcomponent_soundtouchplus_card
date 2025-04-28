// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":pandora-browser");

// lovelace card imports.
import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import { FavBrowserBase } from './fav-browser-base';
import { Section } from '../types/section';
import { MediaPlayer } from '../model/media-player';
import { formatTitleInfo } from '../utils/media-browser-utils';
import { getHomeAssistantErrorMessage, getUtcNowTimestamp } from '../utils/utils';
import { INavigateItem } from '../types/soundtouchplus/navigate-item';
import { EDITOR_PANDORA_ACCOUNT_CHANGED } from '../events/editor-pandora-account-changed';


@customElement("stpc-pandora-browser")
export class PandoraBrowser extends FavBrowserBase {

  /** Array of items to display in the media list. */
  protected override mediaList!: Array<INavigateItem> | undefined;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super(Section.PANDORA_STATIONS);
    this.filterCriteriaPlaceholder = "filter by name";
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
    const filteredItems = this.mediaList?.filter((item: INavigateItem) => (item.ContentItem?.Name?.toLocaleLowerCase().indexOf(filterName) !== -1));
    this.filterItemCount = filteredItems?.length;

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.pandoraBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList, filteredItems);
    const subtitle = formatTitleInfo(this.config.pandoraBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList, filteredItems);

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
            if ((this.config.pandoraBrowserItemsPerRow || 1) === 1) {
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
      if (!this.config.pandoraSourceAccount) {
        this.alertErrorSet('Pandora user account not configured');
        this.isUpdateInProgress = false;
        return true;
      }

      // we use the `Promise.allSettled` approach here like we do with actions, so
      // that we can easily add promises if more data gathering is needed in the future.
      const promiseRequests = new Array<Promise<unknown>>();

      // create promise - get media list.
      const promiseUpdateMediaList = new Promise((resolve, reject) => {

        // call the service to retrieve the media list.
        this.soundTouchPlusService.MusicServiceStationList(player, "PANDORA", (this.config.pandoraSourceAccount || ""), "stationName")
          .then(result => {

            // load media list results.
            this.mediaList = result.Items;
            this.mediaListLastUpdatedOn = result.LastUpdatedOn || getUtcNowTimestamp();

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
            super.updatedMediaListError("Get Music Service Station List failed: " + getHomeAssistantErrorMessage(error));

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
      super.updatedMediaListError("Pandora Station items refresh failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {
    }
  }


  /**
   * Invoked when the component is added to the document's DOM.
   *
   * In `connectedCallback()` you should setup tasks that should only occur when
   * the element is connected to the document. The most common of these is
   * adding event listeners to nodes external to the element, like a keydown
   * event handler added to the window.
   *
   * Typically, anything done in `connectedCallback()` should be undone when the
   * element is disconnected, in `disconnectedCallback()`.
   */
  public connectedCallback() {

    // invoke base class method.
    super.connectedCallback();

    // add event listeners for this document.
    document.addEventListener(EDITOR_PANDORA_ACCOUNT_CHANGED, this.onEditorPandoraAccountChangedEventHandler);

  }


  /**
   * Invoked when the component is removed from the document's DOM.
   *
   * This callback is the main signal to the element that it may no longer be
   * used. `disconnectedCallback()` should ensure that nothing is holding a
   * reference to the element (such as event listeners added to nodes external
   * to the element), so that it is free to be garbage collected.
   *
   * An element may be re-connected after being disconnected.
   */
  public disconnectedCallback() {

    // remove event listeners for this document.
    document.removeEventListener(EDITOR_PANDORA_ACCOUNT_CHANGED, this.onEditorPandoraAccountChangedEventHandler);

    // invoke base class method.
    super.disconnectedCallback();
  }


  /**
   * Handles the card configuration editor `EDITOR_CONFIG_AREA_SELECTED` event.
   * 
   * This will select a section for display / rendering.
   * This event should only be fired from the configuration editor instance.
   * 
   * @param ev Event definition and arguments.
  */
  protected onEditorPandoraAccountChangedEventHandler = () => {

    if (debuglog.enabled) {
      debuglog("onEditorPandoraAccountChangedEventHandler - Pandora account was changed in card config; medialist will be refreshed");
    }

    // force media list to refresh on next render.
    this.storageValuesClear();

  }

}

