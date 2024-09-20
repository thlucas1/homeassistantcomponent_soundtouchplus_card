// lovelace card imports.
import { css, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';

// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import { Card } from '../card';
import { CardConfig } from '../types/CardConfig';
import { Section } from '../types/Section';
import { Store } from '../model/Store';
import { MediaPlayer } from '../model/MediaPlayer';
import { customEvent, isCardInEditPreview } from '../utils/utils';
import { formatTitleInfo } from '../utils/media-browser-utils';
import { SoundTouchPlusService } from '../services/SoundTouchPlusService';
import { ITEM_SELECTED } from '../constants';
import { NavigateItem } from '../types/soundtouchplus/NavigateItem';
import { EDITOR_PANDORA_ACCOUNT_CHANGED } from '../events/editor-pandora-account-changed';


@customElement("stpc-pandora-browser")
export class PandoraBrowser extends LitElement {

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

  /** SoundTouchPlus device navigate response list. */
  private mediaList!: NavigateItem[] | undefined;

  /** SoundTouchPlus services instance. */
  private soundTouchPlusService!: SoundTouchPlusService;


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

    //console.log("render (pandora-browser) - rendering control\n- mediaListLastUpdatedOn=%s",
    //  JSON.stringify(this.mediaListLastUpdatedOn)
    //);

    // set common references from application common storage area.
    this.hass = this.store.hass
    this.config = this.store.config;
    this.player = this.store.player;
    this.soundTouchPlusService = this.store.soundTouchPlusService;

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.pandoraBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList);
    const subtitle = formatTitleInfo(this.config.pandoraBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList);

    // render html.
    return html`
      <div class="pandora-browser-section">
        ${title ? html`<div class="pandora-browser-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="pandora-browser-subtitle">${subtitle}</div>` : html``}
        <div class="pandora-browser-content">
          ${this._alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this._alertErrorClear}>${this._alertError}</ha-alert>` : ""}
          ${this._alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this._alertInfoClear}>${this._alertInfo}</ha-alert>` : ""}
          ${(() => {
            if (this.config.pandoraBrowserItemsPerRow === 1) {
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

    //console.log("firstUpdated (album-fav-browser) - changedProperties keys:\n- %s",
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

    // add event listeners for this document.
    document.addEventListener(EDITOR_PANDORA_ACCOUNT_CHANGED, this.OnEditorPandoraAccountChangedEventHandler);

    //console.log("%c connectedCallback (card) - added event listener: %s",
    //  "color: red;",
    //  JSON.stringify(EDITOR_PANDORA_ACCOUNT_CHANGED),
    //);

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

    // remove event listeners for this document.
    document.removeEventListener(EDITOR_PANDORA_ACCOUNT_CHANGED, this.OnEditorPandoraAccountChangedEventHandler);

    //console.log("%c connectedCallback (card) - removed event listener: %s",
    //  "color: blue;",
    //  JSON.stringify(EDITOR_PANDORA_ACCOUNT_CHANGED),
    //);

    // invoke base class method.
    super.disconnectedCallback();
  }


  /**
   * Handles the `EDITOR_PANDORA_ACCOUNT_CHANGED` event.
   * 
   * @param ev Event definition and arguments.
  */
  protected OnEditorPandoraAccountChangedEventHandler = () => {

    //console.log("OnEditorPandoraAccountChangedEventHandler (card) - Pandora account was changed in card config; medialist will be refreshed");

    // force media list to refresh on next render.
    this.mediaListLastUpdatedOn = -1;
    const cacheKey = 'pandora-browser';
    if (cacheKey in Card.mediaListCache) {
      delete Card.mediaListCache[cacheKey];
    }

  };


  /**
   * Handles the `item-selected` event fired when a media browser item is clicked.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected OnItemSelected = (args: CustomEvent) => {

    //console.log("OnItemSelected (pandora-browser) - media item selected:\n%s",
    //  JSON.stringify(args.detail, null, 2),
    //);

    const mediaItem = args.detail;
    this.PlayItem(mediaItem);
    this.dispatchEvent(customEvent(ITEM_SELECTED, mediaItem));

  };


  /**
   * Calls the SoundTouchPlusService PlayContentItem method to play media.
   * 
   * @param mediaItem The medialist item that was selected.
   */
  private async PlayItem(mediaItem: NavigateItem) {

    try {

      if (mediaItem.ContentItem) {

        // play content item.
        await this.soundTouchPlusService.PlayContentItem(this.player.id, mediaItem.ContentItem);

        // show player section.
        this.store.card.SetSection(Section.PLAYER);

      }
    }
    catch (error) {

      this._alertErrorSet((error as Error).message);

    }
  }


  /**
   * Updates the mediaList with the most current list of pandora station items from the 
   * SoundTouch device.  
   */
  private updateMediaList(player: MediaPlayer): void {

    // check for conditions that prevent the content from showing.
    if (!this.config.pandoraSourceAccount) {
      this._alertErrorSet('Pandora user account not configured');
      return;
    }

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
      const cacheKey = 'pandora-browser';
      this.mediaList = undefined;
      const isCardEditMode = isCardInEditPreview(this.store.card);
      if ((isCardEditMode) && (cacheKey in Card.mediaListCache)) {
        this.mediaList = Card.mediaListCache[cacheKey] as [];
        this.isUpdateInProgress = false;
        super.requestUpdate();
        //console.log("%c updateMediaList (pandora-browser) - medialist loaded from cache",
        //  "color: orange;",
        //);
        return;
      }

      //console.log("%c updateMediaList (pandora-browser) - updating medialist",
      //  "color: orange;",
      //);

      // update status.
      this._alertInfo = "Refreshing media list ...";

      // call the service to retrieve the media list.
      this.soundTouchPlusService.MusicServiceStationList(player.id, "PANDORA", this.config.pandoraSourceAccount, "stationName")
        .then(result => {

          this.mediaList = result.Items;
          this.mediaListLastUpdatedOn = result.LastUpdatedOn || (Date.now() / 1000);
          this.isUpdateInProgress = false;
          this._alertClear();

          //console.log("%c pandora-browser - updateMediaList info AFTER update:\n- player id = %s\n- %s = mediaListLastUpdatedOn",
          //  "color: green;",
          //  this.player.id,
          //  this.mediaListLastUpdatedOn);

          // if editing the card then store the list in the cache for next time.
          if ((isCardEditMode) && !(cacheKey in Card.mediaListCache)) {
            Card.mediaListCache[cacheKey] = this.mediaList || [];
          }

          // if no items then update status.
          if ((this.mediaList) && (this.mediaList.length == 0)) {
            this._alertInfo = "No items found";
          }

        })
        .catch(error => {

          // a console `uncaught exception` will be is logged if an exception gets thrown in this catch block!

          // clear results due to error and update status.
          this.mediaList = undefined;
          this.mediaListLastUpdatedOn = 0;
          this.isUpdateInProgress = false;
          this._alertErrorSet("Pandora favorites refresh failed: \n" + error.message);

        });

    } catch (error) {

      // update status.
      this.isUpdateInProgress = false;
      this._alertErrorSet("Pandora favorites refresh failed: " + error);

    } finally {
    }
  }
}