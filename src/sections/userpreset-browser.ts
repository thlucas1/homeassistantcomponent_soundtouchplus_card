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
import { ProgressStartedEvent } from '../events/progress-started';
import { ProgressEndedEvent } from '../events/progress-ended';
import { ITEM_SELECTED } from '../constants';
import { ContentItemParent } from '../types/soundtouchplus/ContentItem';


@customElement("stpc-userpreset-browser")
export class UserPresetBrowser extends LitElement {

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

  /** User preset list. */
  private mediaList!: ContentItemParent[] | undefined;

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

    //console.log("render (userpreset-browser) - rendering control\n- mediaListLastUpdatedOn=%s",
    //  JSON.stringify(this.mediaListLastUpdatedOn)
    //);

    // set common references from application common storage area.
    this.hass = this.store.hass
    this.config = this.store.config;
    this.player = this.store.player;
    this.soundTouchPlusService = this.store.soundTouchPlusService;

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.userPresetBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList);
    const subtitle = formatTitleInfo(this.config.userPresetBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList);

    // render html.
    return html`
      <div class="userpreset-browser-section">
        ${title ? html`<div class="userpreset-browser-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="userpreset-browser-subtitle">${subtitle}</div>` : html``}
        <div class="userpreset-browser-content">
          ${this._alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this._alertErrorClear}>${this._alertError}</ha-alert>` : ""}
          ${this._alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this._alertInfoClear}>${this._alertInfo}</ha-alert>` : ""}
          ${(() => {
            if (this.config.userPresetBrowserItemsPerRow === 1) {
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

      .userpreset-browser-section {
        color: var(--secondary-text-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .userpreset-browser-title {
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

      .userpreset-browser-subtitle {
        margin: 0.1rem 0;
        align-items: center;
        display: flex;
        justify-content: center;
        text-align: center;
        font-weight: normal;
        font-size: 0.85rem;
        color: var(--secondary-text-color);
      }

      .userpreset-browser-content {
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
    this.updateMediaList();
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

    //console.log("OnItemSelected (userpreset-browser) - media item selected:\n%s",
    //  JSON.stringify(args.detail,null,2),
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
  private async PlayItem(mediaItem: ContentItemParent) {

    try {

      // play content item.
      await this.soundTouchPlusService.PlayContentItem(this.player.id, mediaItem.ContentItem);

      // show player section.
      this.store.card.SetSection(Section.PLAYER);

    }
    catch (error) {

      this._alertErrorSet((error as Error).message);

    }
  }


  /**
   * Updates the mediaList with the most current list of user presets from the configuration.
   */
  private updateMediaList(): void {

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
      // we also copy the array (do not use `this.mediaList = this.config.userPresets`, as it
      // maintains object references and causes objects to keep appending!).
      this.mediaListLastUpdatedOn = (Date.now() / 1000);

      // if card is being edited, then we will use the cached media list as the data source;
      // otherwise, we will refresh the media list from the real-time source.
      const cacheKey = 'userpreset-browser';
      this.mediaList = undefined;
      const isCardEditMode = isCardInEditPreview(this.store.card);
      if ((isCardEditMode) && (cacheKey in Card.mediaListCache)) {
        this.mediaList = Card.mediaListCache[cacheKey] as ContentItemParent[];
        this.isUpdateInProgress = false;
        super.requestUpdate();
        //console.log("%c updateMediaList (userpreset-browser) - medialist loaded from cache",
        //  "color: orange;",
        //);
        return;
      }

      //console.log("%c updateMediaList (userpreset-browser) - updating medialist",
      //  "color: orange;",
      //);

      // update status.
      this._alertInfo = "Refreshing media list ...";

      // load media list.
      this.mediaList = JSON.parse(JSON.stringify(this.config.userPresets || [])) as ContentItemParent[];
      this.mediaListLastUpdatedOn = (Date.now() / 1000);
      if (!this.mediaList) {
        this.mediaList = new Array<ContentItemParent>();
      }

      //console.log("%c updateMediaList (userpreset-browser) - medialist before url load:\n%s",
      //  "color: orange;",
      //  JSON.stringify(this.mediaList,null,2),
      //);

      // was a user presets url specified?
      if (this.config.userPresetsFile || '' != '') {

        // call the service to retrieve the media list.
        const url = this.config.userPresetsFile + '?nocache=' + Date.now()  // force refresh if cached
        this.UserPresetList(url)
          .then(result => {

            // append user-configured results to file results and update status.
            (this.mediaList || []).push(...result);
            this.mediaListLastUpdatedOn = (Date.now() / 1000);
            this.isUpdateInProgress = false;
            this._alertClear();

            //console.log("%c userpreset-browser - updateMediaList info AFTER update:\n- mediaListLastUpdatedOn=%s\n- player id=%s",
            //  "color: green;",
            //  JSON.stringify(this.mediaListLastUpdatedOn),
            //  JSON.stringify(this.player.id),
            //);

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

            // a console `uncaught exception` will be logged if an exception gets thrown in this catch block!

            // update status, but do not clear response in case we loaded items from configuration settings.
            this.isUpdateInProgress = false;
            this._alertErrorSet("User Presets refresh failed: \n" + error.message);

          });

      } else {

        // if no file to load from, then loading is complete.
        this.isUpdateInProgress = false;
        this._alertClear();

        // if no items then update status.
        if ((this.mediaList) && (this.mediaList.length == 0)) {
          this._alertInfo = "No items found";
        }

      }

    } catch (error) {

      // update status.
      this.isUpdateInProgress = false;
      this._alertErrorSet("User Presets refresh failed: " + error);

    } finally {
    }
  }


  /**
   * Retrieves the list of user presets from a url.
   * 
   * @param url URL that contains user presets (e.g. "/local/soundtouchplus/userpresets.json").
   * @returns A ContentItemParent[] object.
  */
  public async UserPresetList(url: string): Promise<ContentItemParent[]> {

    try {

      //console.log("%c UserPresetList (userpreset-browser) - Retrieving url:\n%s",
      //  "color: orange;",
      //  JSON.stringify(url),
      //);

      // show the progress indicator on the main card.
      this.store.card.dispatchEvent(ProgressStartedEvent(Section.USERPRESETS));

      const responseObj = await fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error("server response: " + response.status + " " + response.statusText);
          }
          return response.json();
        })
        .then(response => {
          const responseObj = response as ContentItemParent[]
          return responseObj;
        })
        .catch(err => {
          //console.log("UserPresetList (userpreset-browser) - Could not fetch userpresets url\n- url = %s\n- reason: %s", url, err);
          throw new Error("Could not fetch userpresets url (" + url + "); " + (err as Error).message);
        });

      //console.log("%c updateMediaList (userpreset-browser) - medialist url response:\n%s",
      //  "color: orange;",
      //  JSON.stringify(responseObj, null, 2),
      //);

      return responseObj as ContentItemParent[];

    } finally {

      // hide the progress indicator on the main card.
      this.store.card.dispatchEvent(ProgressEndedEvent());
    }
  }

}