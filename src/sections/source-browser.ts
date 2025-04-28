// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":source-browser");

// lovelace card imports.
import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import {
  mdiApple,
  mdiAudioInputRca,
  mdiBluetooth,
  mdiMicrophone,
  mdiPandora,
  mdiRadio,
  mdiSpeakerMessage,
  mdiSpotify,
  mdiTelevision,
  mdiVideoInputHdmi
} from '@mdi/js';

// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import { FavBrowserBase } from './fav-browser-base';
import { Section } from '../types/section';
import { MediaPlayer } from '../model/media-player';
import { formatTitleInfo, getMdiIconImageUrl } from '../utils/media-browser-utils';
import { getHomeAssistantErrorMessage, getUtcNowTimestamp } from '../utils/utils';
import { IPreset } from '../types/soundtouchplus/preset';
import { IContentItem, IContentItemParent } from '../types/soundtouchplus/content-item';


@customElement("stpc-source-browser")
export class SourceBrowser extends FavBrowserBase {

  /** Array of items to display in the media list. */
  protected override mediaList!: Array<IContentItemParent> | undefined;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super(Section.SOURCES);
    this.filterCriteriaPlaceholder = "filter by name";
    this.isActionsEnabled = false;
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

    // filter items.
    const filterName = (this.filterCriteria || "").toLocaleLowerCase();
    const filteredItems = this.mediaList?.filter((item: IPreset) => (item.ContentItem?.Name?.toLocaleLowerCase().indexOf(filterName) !== -1));
    this.filterItemCount = filteredItems?.length;

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.sourceBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList, filteredItems);
    const subtitle = formatTitleInfo(this.config.sourceBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList, filteredItems);

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
            if ((this.config.sourceBrowserItemsPerRow || 1) === 1) {
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

      // initialize the media list, as we are loading it from multiple sources.
      this.mediaListLastUpdatedOn = getUtcNowTimestamp();
      this.mediaList = new Array<IContentItemParent>();

      // we use the `Promise.allSettled` approach here like we do with actions, so
      // that we can easily add promises if more data gathering is needed in the future.
      const promiseRequests = new Array<Promise<unknown>>();

      // create promise - get media list from config settings.
      const promiseUpdateMediaListConfig = new Promise((resolve, reject) => {

        try {

          // build an array of IContentItemParent objects that can be used in the media browser.
          this.mediaList = new Array<IContentItemParent>();
          for (const source of (player.attributes.source_list || [])) {

            // create new content item parent and set name value.
            const parent = <IContentItemParent>{};
            parent.ContentItem = <IContentItem>{};
            parent.ContentItem.Name = source;

            // set container art path using mdi icons for common sources.
            if (source.startsWith('Airplay')) {
              parent.ContentItem.ContainerArt = getMdiIconImageUrl(mdiApple);
            } else if (source.startsWith('Pandora')) {
              parent.ContentItem.ContainerArt = getMdiIconImageUrl(mdiPandora);
            } else if (source.startsWith('Spotify')) {
              parent.ContentItem.ContainerArt = getMdiIconImageUrl(mdiSpotify);
            } else if (source.startsWith('Tunein')) {
              parent.ContentItem.ContainerArt = getMdiIconImageUrl(mdiRadio);
            } else if (source.startsWith('Alexa')) {
              parent.ContentItem.ContainerArt = getMdiIconImageUrl(mdiMicrophone);
            } else if (source.startsWith('Bluetooth')) {
              parent.ContentItem.ContainerArt = getMdiIconImageUrl(mdiBluetooth);
            } else if (source.startsWith('Notification')) {
              parent.ContentItem.ContainerArt = getMdiIconImageUrl(mdiSpeakerMessage);
            } else if (source.startsWith('Product(HDMI')) {
              parent.ContentItem.ContainerArt = getMdiIconImageUrl(mdiVideoInputHdmi);
            } else if (source.startsWith('Product(TV')) {
              parent.ContentItem.ContainerArt = getMdiIconImageUrl(mdiTelevision);
            } else {
              parent.ContentItem.ContainerArt = getMdiIconImageUrl(mdiAudioInputRca);
            }
            this.mediaList.push(parent);
          }

          this.mediaListLastUpdatedOn = getUtcNowTimestamp();

          // call base class method, indicating media list update succeeded.
          super.updatedMediaListOk();

          // resolve the promise.
          resolve(true);
        }
        catch (error) {

          // reject the promise.
          super.updatedMediaListError("Load Source List failed: " + getHomeAssistantErrorMessage(error));
          reject(error);

        }
      });

      promiseRequests.push(promiseUpdateMediaListConfig);

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

    // select the source.
    this.mediaItem = args.detail;
    this.SelectSource(this.mediaItem);

  }


  /**
   * Handles the `item-selected-with-hold` event fired when a media browser item is clicked and held.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected override onItemSelectedWithHold(args: CustomEvent) {

    if (debuglog.enabled) {
      debuglog("onItemSelectedWithHold - media item selected:\n%s",
        JSON.stringify(args.detail, null, 2),
      );
    }

    // select the source.
    this.onItemSelected(args);

  }


  /**
   * Calls the mediaControlService select_source method to select a source.
   *
   * @param mediaItem The Preset item that was selected.
   */
  private async SelectSource(mediaItem: IContentItemParent) {

    try {

      // show progress indicator.
      this.progressShow();

      // select the source.
      await this.store.mediaControlService.select_source(this.player, mediaItem.ContentItem?.Name || '');

      // show player section.
      this.store.card.SetSection(Section.PLAYER);

    }
    catch (error) {

      // set error message and reset scroll position to zero so the message is displayed.
      this.alertErrorSet("Could not select source.  " + getHomeAssistantErrorMessage(error));
      this.mediaBrowserContentElement.scrollTop = 0;

    }
    finally {

      // hide progress indicator.
      this.progressHide();

    }
  }

}
