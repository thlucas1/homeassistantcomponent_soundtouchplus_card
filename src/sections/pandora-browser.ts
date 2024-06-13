// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';

// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import { Store } from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { customEvent } from '../utils/utils';
import { formatTitleInfo } from '../utils/media-browser-utils';
import { ITEM_SELECTED, PANDORA_BROWSER_REFRESH, SECTION_SELECTED } from '../constants';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { CardConfig } from '../types/cardconfig'
import { NavigateItem } from '../types/soundtouchplus/navigateitem';
import { NavigateResponse } from '../types/soundtouchplus/navigateresponse';
import { Section } from '../types/section';

export class PandoraBrowser extends LitElement {

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

  /** SoundTouchPlus device navigate response list. */
  private mediaList!: NavigateResponse;

  /** SoundTouchPlus services instance. */
  private soundTouchPlusService!: SoundTouchPlusService;


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

    //console.log("pandora-browser.render()\n Rendering pandora browser html");

    // set common references from application common storage area.
    this.hass = this.store.hass
    this.config = this.store.config;
    this.player = this.store.player;
    this.soundTouchPlusService = this.store.soundTouchPlusService;

    // if entity value not set then render an error card.
    if (!this.player)
      throw new Error("SoundTouchPlus media player entity id not configured");

    // is this the first render?  if so, then refresh the list.
    if (this.mediaListLastUpdatedOn == -1) {
      if (!this.isUpdateInProgress) {
        this.isUpdateInProgress = true;
        this.updateMediaList(this.player);
      } else {
        //console.log("%c pandora-browser - update already in progress!", "color: orange;");
      }
    }

    //console.log(LOGPFX + "render()\n NavigateResponse.LastUpdatedOn=%s", this.mediaList ? this.mediaList.LastUpdatedOn : "unknown");
    //console.log(LOGPFX + "render()\n this.mediaList='%s'", JSON.stringify(this.mediaList));

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.pandoraBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList?.Items);
    const subtitle = formatTitleInfo(this.config.pandoraBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList?.Items);

    // check for conditions that prevent the content from showing.
    let alertText = undefined
    if (!this.mediaList) {
      alertText = 'No Pandora stations found';
    } else if (!this.config.pandoraSourceAccount) {
      alertText = 'Pandora user account not configured';
    }

    // render html.
    return html`
      <div class="pandora-browser-section">
        ${title ? html`<div class="pandora-browser-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="pandora-browser-subtitle">${subtitle}</div>` : html``}
        <div class="pandora-browser-content">
          ${
          (() => {
            if (alertText) {
              return (
                html`<div class="no-items">${alertText}</div>`
              )
            } else if (this.config.pandoraBrowserItemsPerRow === 1) {
              return (
                html`<stpc-media-browser-list
                    .items=${this.mediaList?.Items}
                    .store=${this.store}
                    @item-selected=${this.OnItemSelected}
                    ></stpc-media-browser-list>
                    `
              )
            } else {
              return (
                html`<stpc-media-browser-icons
                    .items=${this.mediaList?.Items}
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

      .pandora-browser-section {
        color: var(--secondary-text-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .pandora-browser-title {
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

      .pandora-browser-subtitle {
        margin: 0.1rem 0;
        align-items: center;
        display: flex;
        justify-content: center;
        text-align: center;
        font-weight: normal;
        font-size: 0.85rem;
        color: var(--secondary-text-color);
      }

      .pandora-browser-content {
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
  connectedCallback() {

    // invoke base class method.
    super.connectedCallback();

    // add event listeners for this control.
    window.addEventListener(PANDORA_BROWSER_REFRESH, this.OnPandoraBrowserRefresh);
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
  disconnectedCallback() {

    // invoke base class method.
    super.disconnectedCallback();

    // remove event listeners for this control.
    window.removeEventListener(PANDORA_BROWSER_REFRESH, this.OnPandoraBrowserRefresh);
  }


  /**
   * Handles the `PANDORA_BROWSER_REFRESH` event.
   * 
   * @param args Event arguments (none passed).
  */
  protected OnPandoraBrowserRefresh = () => {

    //console.log("OnPandoraBrowserRefresh event handler - event data:\n%s", JSON.stringify(args, null, 2));

    // force media list to refresh on next render.
    this.mediaListLastUpdatedOn = -1;
  };


  /**
   * Handles the `item-selected` event fired when a media browser item is clicked.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected OnItemSelected = (args: CustomEvent) => {
    //console.log("pandora-browser.OnItemSelected - args:\n%s", JSON.stringify(args));
    const mediaItem = args.detail;
    this.PlayItem(mediaItem);
    this.dispatchEvent(customEvent(ITEM_SELECTED, mediaItem));
  };


  /**
   * Calls the SoundTouchPlusService PlayContentItem method to play media.
   * 
   * @param mediaItem The NavigateItem item that was selected.
   */
  private async PlayItem(mediaItem: NavigateItem) {

    if (mediaItem.ContentItem) {

      // play the content.
      await this.soundTouchPlusService.PlayContentItem(this.player.id, mediaItem.ContentItem);

      // show the player section (only shown if it's active).
      const event = customEvent(SECTION_SELECTED, Section.PLAYER);
      window.dispatchEvent(event);
    }
  }


  /**
   * Updates the mediaList with the most current list of pandora station items from the 
   * SoundTouch device.  
   * 
   * This method is called when the section is initially displayed, as well as when
   * a refresh request is initiated by the user.
   */
  private updateMediaList(player: MediaPlayer): void {

    // update the media list; we will force the `mediaListLastUpdatedOn` attribute 
    // with the current epoch date (in seconds) so that the refresh is only triggered once.
    this.mediaListLastUpdatedOn = (Date.now() / 1000);

    // was a user account configured?  if not, then we are done!
    if (!this.config.pandoraSourceAccount) {
      return;
    }

    // call the service to retrieve the media list.
    this.soundTouchPlusService.MusicServiceStationList(player.id, "PANDORA", this.config.pandoraSourceAccount, "stationName")
      .then(result => {
        this.mediaList = result;
        this.mediaListLastUpdatedOn = result.LastUpdatedOn || (Date.now() / 1000);
        this.isUpdateInProgress = false;
        //console.log("%c pandora-browser render - updateMediaList check info AFTER update:\n %s=mediaListLastUpdatedOn", "color: green;", JSON.stringify(this.mediaListLastUpdatedOn));
        this.requestUpdate();
      });
  }
}