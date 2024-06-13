// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
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
import { Store } from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { customEvent } from '../utils/utils';
import { formatTitleInfo, getMdiIconImageUrl } from '../utils/media-browser-utils';
import { ITEM_SELECTED, SECTION_SELECTED } from '../constants';
import { CardConfig } from '../types/cardconfig'
import { Section } from '../types/section'
import { ContentItemParent, ContentItem } from '../types/soundtouchplus/contentitem';


export class SourceBrowser extends LitElement {

  /** Home Assistant hass instance. */
  @property({ attribute: false }) public hass!: HomeAssistant;

  /** Application common storage area. */
  @property({ attribute: false }) store!: Store;

  /** Card configuration data. */
  private config!: CardConfig;

  /** MediaPlayer instance created from the configuration entity id. */
  private player!: MediaPlayer;

  /** Indicates if the media list is currently being updated. */
  private isUpdateInProgress!: boolean;

  /** Date and time (in epoch format) of when the media list was last updated. */
  private mediaListLastUpdatedOn!: number;

  /** Media player source list. */
  private mediaList!: ContentItemParent[];


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // initialize storage.
    super();

    // force refresh first time.
    this.isUpdateInProgress = false;
    this.mediaListLastUpdatedOn = -1;  
  }



  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // set common references from application common storage area.
    this.hass = this.store.hass
    this.config = this.store.config;
    this.player = this.store.player;

    // if entity value not set then render an error card.
    if (!this.player)
      throw new Error("SoundTouchPlus media player entity id not configured");

    // is this the first render?  if so, then refresh the list.
    if (this.mediaListLastUpdatedOn == -1) {
      if (!this.isUpdateInProgress) {
        this.isUpdateInProgress = true;
        this.updateMediaList(this.player);
      } else {
        //console.log("%c source-browser - update already in progress!", "color: orange;");
      }
    }

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.sourceBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList);
    const subtitle = formatTitleInfo(this.config.sourceBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList);

    // check for conditions that prevent the content from showing.
    let alertText = undefined
    if (!this.mediaList) {
      alertText = 'No Sources found';
    }

    // render html.
    return html`
      <div class="source-browser-section">
        ${title ? html`<div class="source-browser-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="source-browser-subtitle">${subtitle}</div>` : html``}
        <div class="source-browser-content">
          ${
          (() => {
            if (alertText) {
              return (
                html`<div class="no-items">${alertText}</div>`
              )
            } else if (this.config.sourceBrowserItemsPerRow === 1) {
              return (
                html`<stpc-media-browser-list
                    .items=${this.mediaList}
                    .store=${this.store}
                    @item-selected=${this.OnItemSelected}
                    ></stpc-media-browser-list>
                    `
              )
            } else {
              return (
                html`<stpc-media-browser-icons
                    .items=${this.mediaList}
                    .store=${this.store}
                    @item-selected=${this.OnItemSelected}
                    ></stpc-media-browser-icons>
                    `
              )
            }
          })()  
          }  
        </div>
      </div>
    `;
  }


  /** 
   * style definitions used by this component.
   * */
  static get styles() {
    return css`

      .source-browser-section {
        color: var(--secondary-text-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .source-browser-title {
        margin-top: 0.5rem;
        align-items: center;
        display: flex;
        flex-shrink: 0;
        flex-grow: 0;
        justify-content: center;
        text-align: center;
        font-weight: bold;
        font-size: 1.0rem;
        color: var(--secondary-text-color);
      }

      .source-browser-subtitle {
        margin: 0.1rem 0;
        align-items: center;
        display: flex;
        justify-content: center;
        text-align: center;
        font-weight: normal;
        font-size: 0.85rem;
        color: var(--secondary-text-color);
      }

      .source-browser-content {
        margin: 0.5rem;
        flex: 3;
        max-height: 100vh;
        overflow-y: auto;
      }

      .no-items {
        text-align: center;
        margin-top: 2rem;
      }
    `;
  }


  /**
   * Handles the `item-selected` event fired when a media browser item is clicked.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected OnItemSelected = (args: CustomEvent) => {
    //console.log("source-browser.OnItemSelected - args:\n%s \nargs.detail:\n%s", JSON.stringify(args), JSON.stringify(args.detail));
    const mediaItem = args.detail;  // a ContentItemParent object
    this.SelectSource(mediaItem);
    this.dispatchEvent(customEvent(ITEM_SELECTED, mediaItem));
  };


  /**
   * Calls the SoundTouchPlusService PlayContentItem method to play media.
   * 
   * @param mediaItem The source item that was selected.
   */
  private async SelectSource(mediaItem: ContentItemParent) {

    //console.log("source-browser.SelectSource - mediaItem:\n%s", JSON.stringify(mediaItem));

    // call service to select the source.
    await this.store.mediaControlService.sourceSelect(this.player, mediaItem.ContentItem?.Name || '');

    // show the player section (only shown if it's active).
    const event = customEvent(SECTION_SELECTED, Section.PLAYER);
    window.dispatchEvent(event);
  }


  /**
   * Updates the mediaList with the most current list of sources from the SoundTouch device.  
   * 
   * This method is called when the section is initially displayed, as well as when
   * a refresh request is initiated by the user.
   */
  private updateMediaList(player: MediaPlayer): void {

    // update the media list; we will force the `mediaListLastUpdatedOn` attribute 
    // with the current epoch date (in seconds) so that the refresh is only triggered once.
    this.mediaListLastUpdatedOn = (Date.now() / 1000);

    // no need to call a service - just use the source_list attribute for the list.
    // we could have simplified this, but wanted to keep the structure like the other sections.

    // build an array of ContentItemParent objects that can be used in the media browser.
    this.mediaList = new Array<ContentItemParent>();
    for (const source of (player.attributes.source_list || [])) {

      // create new content item parent and set name value.
      const parent = <ContentItemParent>{};
      parent.ContentItem = <ContentItem>{};
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

    this.mediaListLastUpdatedOn = (Date.now() / 1000);
    this.isUpdateInProgress = false;
    //console.log("%c source-browser - updateMediaList info AFTER update:\n player id=%s\n %s=mediaListLastUpdatedOn\n source_list:\n%s\n mediaList:\n%s",
    //  "color: green;",
    //  this.player.id,
    //  this.mediaListLastUpdatedOn,
    //  this.player.attributes.source_list,
    //  JSON.stringify(this.mediaList));
    this.requestUpdate();
  }
}