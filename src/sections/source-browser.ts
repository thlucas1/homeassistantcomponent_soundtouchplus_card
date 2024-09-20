// lovelace card imports.
import { css, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
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
import { Card } from '../card';
import { CardConfig } from '../types/CardConfig';
import { Section } from '../types/Section';
import { Store } from '../model/Store';
import { MediaPlayer } from '../model/MediaPlayer';
import { customEvent, isCardInEditPreview } from '../utils/utils';
import { formatTitleInfo, getMdiIconImageUrl } from '../utils/media-browser-utils';
import { ITEM_SELECTED } from '../constants';
import { ContentItemParent, ContentItem } from '../types/soundtouchplus/ContentItem';


@customElement("stpc-source-browser")
export class SourceBrowser extends LitElement {

  // public state properties.
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) store!: Store;

  // private state properties.
  @state() private _alertError?: string;
  @state() private _alertInfo?: string;

  /** Card configuration data. */
  private config!: CardConfig;

  /** MediaPlayer instance created from the configuration entity id. */
  private player!: MediaPlayer;

  /** Indicates if the media list is currently being updated. */
  private isUpdateInProgress!: boolean;

  /** Date and time (in epoch format) of when the media list was last updated. */
  private mediaListLastUpdatedOn!: number;

  /** Media player source list. */
  private mediaList!: ContentItemParent[] | undefined;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super();

    // initialize storage.
    this.isUpdateInProgress = false;
    this.mediaListLastUpdatedOn = -1;  
  }



  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    //console.log("render (source-browser) - rendering control\n- mediaListLastUpdatedOn=%s",
    //  JSON.stringify(this.mediaListLastUpdatedOn)
    //);

    // set common references from application common storage area.
    this.hass = this.store.hass
    this.config = this.store.config;
    this.player = this.store.player;

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.sourceBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList);
    const subtitle = formatTitleInfo(this.config.sourceBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList);

    // render html.
    return html`
      <div class="source-browser-section">
        ${title ? html`<div class="source-browser-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="source-browser-subtitle">${subtitle}</div>` : html``}
        <div class="source-browser-content">
          ${this._alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this._alertErrorClear}>${this._alertError}</ha-alert>` : ""}
          ${this._alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this._alertInfoClear}>${this._alertInfo}</ha-alert>` : ""}
          ${(() => {
            if (this.config.sourceBrowserItemsPerRow === 1) {
              return (
                html`<stpc-media-browser-list
                      .items=${this.mediaList}
                      .store=${this.store}
                      @item-selected=${this.OnItemSelected}
                    ></stpc-media-browser-list>`
              )
            } else {
              return (
                html`<stpc-media-browser-icons
                      .items=${this.mediaList}
                      .store=${this.store}
                      @item-selected=${this.OnItemSelected}
                    ></stpc-media-browser-icons>`
              )
            }
          })()}
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

      ha-alert {
        display: block;
        margin-bottom: 0.25rem;
      }
    `;
  }


  /**
   * Called when the element has rendered for the first time. Called once in the
   * lifetime of an element. Useful for one-time setup work that requires access to
   * the DOM.
   */
  protected firstUpdated(changedProperties: PropertyValues): void {

    // invoke base class method.
    super.firstUpdated(changedProperties);

    //console.log("firstUpdated (userpreset-browser) - changedProperties keys:\n- %s",
    //  JSON.stringify(Array.from(changedProperties.keys())),
    //);

    // refresh the medialist.
    this.updateMediaList(this.player);
  }


  /**
   * Clears the error and informational alert text.
   */
  private _alertClear() {
    this._alertInfo = undefined;
    this._alertError = undefined;
  }


  /**
   * Clears the error alert text.
   */
  private _alertErrorClear() {
    this._alertError = undefined;
  }


  /**
   * Sets the alert error message, and clears the informational alert message.
   */
  private _alertErrorSet(message: string): void {
    this._alertError = message;
    this._alertInfoClear();
  }


  /**
   * Clears the informational alert text.
   */
  private _alertInfoClear() {
    this._alertInfo = undefined;
  }


  /**
   * Handles the `item-selected` event fired when a media browser item is clicked.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected OnItemSelected = (args: CustomEvent) => {

    //console.log("OnItemSelected (source-browser) - media item selected:\n%s",
    //  JSON.stringify(args.detail, null, 2),
    //);

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

    //console.log("SelectSource (source-browser) - select source\n- mediaItem:\n%s",
    //  JSON.stringify(mediaItem, null, 2),
    //);

    try {

      // select the source.
      await this.store.mediaControlService.sourceSelect(this.player, mediaItem.ContentItem?.Name || '');

      // show player section.
      this.store.card.SetSection(Section.PLAYER);

    }
    catch (error) {

      this._alertErrorSet((error as Error).message);

    }

  }


  /**
   * Updates the mediaList with the most current list of sources from the SoundTouch device.  
   */
  private updateMediaList(player: MediaPlayer): void {

    // check if update is already in progress.
    if (!this.isUpdateInProgress) {
      this.isUpdateInProgress = true;
    } else {
      this._alertErrorSet("Previous refresh is still in progress - please wait");
      return;
    }

    try {

      // clear alerts.
      this._alertClear();

      // update the media list; we will force the `mediaListLastUpdatedOn` attribute
      // with the current epoch date (in seconds) so that the refresh is only triggered once.
      this.mediaListLastUpdatedOn = (Date.now() / 1000);

      // if card is being edited, then we will use the cached media list as the data source;
      // otherwise, we will refresh the media list from the real-time source.
      const cacheKey = 'source-browser';
      this.mediaList = undefined;
      const isCardEditMode = isCardInEditPreview(this.store.card);
      if ((isCardEditMode) && (cacheKey in Card.mediaListCache)) {
        this.mediaList = Card.mediaListCache[cacheKey] as [];
        this.isUpdateInProgress = false;
        super.requestUpdate();
        //console.log("%c updateMediaList (source-browser) - medialist loaded from cache",
        //  "color: orange;",
        //);
        return;
      }

      // no need to call a service - just use the source_list attribute for the list.
      // we could have simplified this, but wanted to keep the structure like the other sections.

      //console.log("%c updateMediaList (source-browser) - updating medialist\n-source_list:\n%s",
      //  "color: orange;",
      //  JSON.stringify(player.attributes.source_list,null,2)
      //);

      // update status.
      this._alertInfo = "Refreshing media list ...";

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
      this._alertClear();

      //console.log("%c source-browser - updateMediaList info AFTER update:\n player id=%s\n %s=mediaListLastUpdatedOn\n source_list:\n%s\n mediaList:\n%s",
      //  "color: green;",
      //  this.player.id,
      //  this.mediaListLastUpdatedOn,
      //  this.player.attributes.source_list,
      //  JSON.stringify(this.mediaList)
      //);

      // if editing the card then store the list in the cache for next time.
      if ((isCardEditMode) && !(cacheKey in Card.mediaListCache)) {
        Card.mediaListCache[cacheKey] = this.mediaList;
      }

      // if no items then update status.
      if ((this.mediaList) && (this.mediaList.length == 0)) {
        this._alertInfo = "No items found";
      }

    } catch (error) {

      // update status.
      this.isUpdateInProgress = false;
      this._alertErrorSet("Source list refresh failed: " + error);

    } finally {
    }
  }
}