// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":userpreset-browser");

// lovelace card imports.
import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import '../components/userpreset-actions';
import { FavBrowserBase } from './fav-browser-base';
import { Section } from '../types/section';
import { MediaPlayer } from '../model/media-player';
import { formatTitleInfo } from '../utils/media-browser-utils';
import { getHomeAssistantErrorMessage, getUtcNowTimestamp } from '../utils/utils';
import { FilterSectionMediaEvent } from '../events/filter-section-media';
import { IUserPreset } from '../types/soundtouchplus/user-preset';


@customElement("stpc-userpreset-browser")
export class UserPresetBrowser extends FavBrowserBase {

  /** Array of items to display in the media list. */
  protected override mediaList!: Array<IUserPreset> | undefined;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super(Section.USERPRESETS);
    this.filterCriteriaPlaceholder = "filter by preset name or source";
    this.isMediaListRefreshedOnSectionEntry = true;

  }


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // invoke base class method.
    super.render();

    // filter items (if actions are not visible).
    let filteredItems: Array<IUserPreset> | undefined;
    if (!this.isActionsVisible) {
      const filterName = (this.filterCriteria || "").toLocaleLowerCase();
      filteredItems = this.mediaList?.filter((item: IUserPreset) => (item.ContentItem?.Name?.toLocaleLowerCase().indexOf(filterName) !== -1) || (item.ContentItem.Source?.toLocaleLowerCase().indexOf(filterName) !== -1));
      this.filterItemCount = filteredItems?.length;
    }

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.userPresetBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList, filteredItems);
    const subtitle = formatTitleInfo(this.config.userPresetBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList, filteredItems);

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
            // if actions are not visbile, then render the media list.
            if (!this.isActionsVisible) {
              if ((this.config.userPresetBrowserItemsPerRow || 1) === 1) {
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
              // if actions are visbile, then render the actions display.
            } else {
              return html`<stpc-userpreset-actions class="media-browser-actions" .store=${this.store} .mediaItem=${this.mediaItem}></stpc-userpreset-actions>`;
            }
          })()}  
        </div>
      </div>
    `;
  }


  /**
   * Handles the `item-selected` event fired when a media browser item is clicked.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected override onItemSelected(args: CustomEvent) {

    if (debuglog.enabled) {
      debuglog("onItemSelected - media item selected:\n%s",
        JSON.stringify(args.detail, null, 2),
      );
    }

    // is this a filtersection type?
    if (args.detail.type == "filtersection") {

      const preset = args.detail as IUserPreset;

      // validate filter section name.
      const enumValues: string[] = Object.values(Section);
      if (!enumValues.includes(preset.filter_section || "")) {
        this.alertErrorSet("Preset filter_section \"" + preset.filter_section + "\" is not a valid section identifier.");
        return;
      }

      // fire event.
      this.dispatchEvent(FilterSectionMediaEvent(preset.filter_section, preset.filter_criteria));

      // is this a dlna url type?
    } else if (args.detail.type == "dlnaurl") {

      // play url DLNA media.
      const preset = args.detail as IUserPreset;
      super.PlayUrlDlna(
        preset.ContentItem?.Location || "",
        preset.artist_name,
        preset.album_name,
        preset.ContentItem?.Name,
        preset.ContentItem?.ContainerArt
      );

    } else {

      // call base class method to handle it.
      super.onItemSelected(args);

    }

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

      // initialize the media list, as we are loading it from multiple sources.
      this.mediaListLastUpdatedOn = getUtcNowTimestamp();
      this.mediaList = new Array<IUserPreset>();

      // we use the `Promise.allSettled` approach here like we do with actions, so
      // that we can easily add promises if more data gathering is needed in the future.
      const promiseRequests = new Array<Promise<unknown>>();

      // create promise - get media list from config settings.
      const promiseUpdateMediaListConfig = new Promise((resolve, reject) => {

        try {

          // load settings, append to the media list, and resolve the promise.
          const result = JSON.parse(JSON.stringify(this.config.userPresets || [])) as IUserPreset[];
          if (result) {

            // set where the configuration items were loaded from, and
            // replace nocache indicator if specified.
            //const noCacheKey = "nocache=" + getUtcNowTimestamp();
            result.forEach(item => {
              item.origin = "card config";
              //item.image_url = (item.image_url || "").replace("{nocache}", noCacheKey);
            });

            // append results to media list.
            (this.mediaList || []).push(...result);
          }

          // call base class method, indicating media list update succeeded.
          super.updatedMediaListOk();
          resolve(true);
        }
        catch (error) {

          // reject the promise.
          super.updatedMediaListError("Load User Presets from config failed: " + getHomeAssistantErrorMessage(error));
          reject(error);

        }
      });

      promiseRequests.push(promiseUpdateMediaListConfig);

      // was a user presets url specified?
      if (this.config.userPresetsFile || '' != '') {

        // create promise - get media list from user presets url.
        const promiseUpdateMediaListUrl = new Promise((resolve, reject) => {

          // call fetch api to get media list content from the url.
          // note that "nocache=" will force refresh, if url content is cached.
          fetch(this.config.userPresetsFile + '?nocache=' + Date.now())
            .then(response => {
              // if bad response then raise an exception with error details.
              if (!response.ok) {
                throw new Error("server response: " + response.status + " " + response.statusText);
              }
              // otherwise, return json response data.
              return response.json();
            })
            .then(response => {
              // append to the media list, and resolve the promise.
              const responseObj = response as IUserPreset[]
              if (responseObj) {

                // set where the configuration items were loaded from, and 
                // replace nocache indicator if specified.
                //const noCacheKey = "nocache=" + getUtcNowTimestamp();
                responseObj.forEach(item => {
                  item.origin = this.config.userPresetsFile as string;
                  //item.image_url = (item.image_url || "").replace("{nocache}", noCacheKey);
                });

                // append results to media list.
                (this.mediaList || []).push(...responseObj);
              }

              // call base class method, indicating media list update succeeded.
              super.updatedMediaListOk();
              resolve(true);
            })
            .catch(error => {
              // process error result and reject the promise.
              super.updatedMediaListError("Could not fetch data from configuration `userPresetsFile` (" + this.config.userPresetsFile + "); " + getHomeAssistantErrorMessage(error));
              reject(error);
            });
        });

        promiseRequests.push(promiseUpdateMediaListUrl);
      }

      // show visual progress indicator.
      this.progressShow();

      // execute all promises, and wait for all of them to settle.
      // we use `then` logic so we can log the mediaList contents
      // since we are not calling a service / logging service response. 
      // we use `finally` logic so we can clear the progress indicator.
      // any exceptions raised should have already been handled in the 
      // individual promise definitions; nothing else to do at this point.
      Promise.allSettled(promiseRequests)
        .then(results => {
          if (results) { }  // keep compiler happy

          if (debuglog.enabled) {
            debuglog("%cupdateMediaList - %s mediaList response:\n%s",
              "color: red",
              JSON.stringify(this.mediaType),
              JSON.stringify(this.mediaList, null, 2),
            );
          }

        })
        .finally(() => {

          // clear the progress indicator.
          this.progressHide();

        });

      return true;

    }
    catch (error) {

      // clear the progress indicator.
      this.progressHide();

      // set alert error message.
      super.updatedMediaListError("User Presets favorites refresh failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {
    }
  }

}