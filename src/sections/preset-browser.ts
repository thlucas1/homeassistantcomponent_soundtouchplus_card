// lovelace card imports.
import { css, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';

// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import { Card } from '../card';
import { CardConfig } from '../types/card-config';
import { Section } from '../types/section';
import { Store } from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { customEvent, isCardInEditPreview } from '../utils/utils';
import { formatTitleInfo } from '../utils/media-browser-utils';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { ITEM_SELECTED, ITEM_SELECTED_WITH_HOLD } from '../constants';
import { Preset } from '../types/soundtouchplus/preset';
import { PresetList } from '../types/soundtouchplus/preset-list';


@customElement("stpc-preset-browser")
export class PresetBrowser extends LitElement {

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

  /** SoundTouchPlus device preset list. */
  private mediaList!: PresetList | undefined;

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
   * 
   * Note the "@item-selected-with-hold" event handler on list generator below.  This allows for a 
   * "click and hold" functionality to allow a preset slot to be "Set" to the currently playing media.
  */
  protected render(): TemplateResult | void {

    //console.log("render (preset-browser) - rendering control\n- mediaListLastUpdatedOn=%s",
    //  JSON.stringify(this.mediaListLastUpdatedOn)
    //);

    // set common references from application common storage area.
    this.hass = this.store.hass
    this.config = this.store.config;
    this.player = this.store.player;
    this.soundTouchPlusService = this.store.soundTouchPlusService;

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.presetBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList?.Presets);
    const subtitle = formatTitleInfo(this.config.presetBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList?.Presets);

    // render html.
    return html`
      <div class="preset-browser-section">
        ${title ? html`<div class="preset-browser-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="preset-browser-subtitle">${subtitle}</div>` : html``}
        <div class="preset-browser-content">
          ${this._alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this._alertErrorClear}>${this._alertError}</ha-alert>` : ""}
          ${this._alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this._alertInfoClear}>${this._alertInfo}</ha-alert>` : ""}
          ${(() => {
            if (this.config.presetBrowserItemsPerRow === 1) {
              return (
                html`<stpc-media-browser-list
                    .items=${this.mediaList?.Presets}
                    .store=${this.store}
                    @item-selected=${this.OnItemSelected}
                    @item-selected-with-hold=${this.OnItemSelectedWithHold}
                    ></stpc-media-browser-list>
                    `
              )
            } else {
              return (
                html`<stpc-media-browser-icons
                    .items=${this.mediaList?.Presets}
                    .store=${this.store}
                    @item-selected=${this.OnItemSelected}
                    @item-selected-with-hold=${this.OnItemSelectedWithHold}
                    ></stpc-media-browser-icons>
                    `
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

      .preset-browser-section {
        color: var(--secondary-text-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .preset-browser-title {
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

      .preset-browser-subtitle {
        margin: 0.1rem 0;
        align-items: center;
        display: flex;
        justify-content: center;
        text-align: center;
        font-weight: normal;
        font-size: 0.85rem;
        color: var(--secondary-text-color);
      }

      .preset-browser-content {
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
   * Invoked before `update()` to compute values needed during the update.
   * 
   * We will check for changes in the media player preset last updated date.  
   * If a change is being made, then it denotes the user changed a preset
   * setting on the physical device (or via the SoundTouch app).  In this case,
   * we will refresh the media list with the changes.
   */
  protected willUpdate(changedProperties: PropertyValues): void {

    // invoke base class method.
    super.willUpdate(changedProperties);

    // get list of changed property keys.
    const changedPropKeys = Array.from(changedProperties.keys())

    //console.log("%c willUpdate (player) - changed property keys:\n",
    //  "color: gold;",
    //  JSON.stringify(changedPropKeys),
    //);

    // we only care about "store" property changes at this time, as it contains a
    // reference to the "hass" property.  we are looking for background image changes.
    if (!changedPropKeys.includes('store')) {
      return;
    }

    // did the user change a preset via device hardware buttons?
    // if so, then refresh the media list to reflect it.
    if (!this.isUpdateInProgress) {
      if ((this.mediaList) && ((this.mediaList.LastUpdatedOn || 0) > 0)) {
        if ((this.player.attributes.soundtouchplus_presets_lastupdated || 0) > (this.mediaList.LastUpdatedOn || 0)) {

          //console.log("render (preset-browser) - soundtouchplus_presets_lastupdated changed, refreshing media list\n- %s = mediaListLastUpdatedOn\n- %s = soundtouchplus_presets_lastupdated",
          //  JSON.stringify(this.mediaListLastUpdatedOn),
          //  JSON.stringify(this.player.attributes.soundtouchplus_presets_lastupdated),
          //);

          this.updateMediaList(this.player);
          this.requestUpdate();

        }
      }
    }
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

    //console.log("OnItemSelected (preset-browser) - media item selected:\n%s",
    //  JSON.stringify(args.detail, null, 2),
    //);

    const mediaItem = args.detail;
    this.SelectPreset(mediaItem);
    this.dispatchEvent(customEvent(ITEM_SELECTED, mediaItem));

  };


  /**
   * Handles the `item-selected-with-hold` event fired when a media browser item is clicked and held.
   * 
   * This will set the selected preset item to the currently playing track.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected OnItemSelectedWithHold = (args: CustomEvent) => {

    //console.log("OnItemSelectedWithHold (preset-browser) - media item selected:\n%s",
    //  JSON.stringify(args.detail, null, 2),
    //);

    const mediaItem = args.detail;
    this.StorePreset(mediaItem);
    this.dispatchEvent(customEvent(ITEM_SELECTED_WITH_HOLD, mediaItem));

  };


  /**
   * Calls the SoundTouchPlusService RemoteKeyPress method to select a preset for play.
   * 
   * @param mediaItem The Preset item that was selected.
   */
  private async SelectPreset(mediaItem: Preset) {

    try {

      if (mediaItem.PresetId) {

        // play content item.
        await this.soundTouchPlusService.RemoteKeyPress(this.player.id, "PRESET_" + JSON.stringify(mediaItem.PresetId), "release");

        // show player section.
        this.store.card.SetSection(Section.PLAYER);

      }

    }
    catch (error) {

      this._alertErrorSet((error as Error).message);

    }
  }


  /**
   * Calls the SoundTouchPlusService RemoteKeyPress method to store a preset.
   * 
   * @param mediaItem The Preset item that was selected.
   */
  private async StorePreset(mediaItem: Preset) {

    try {

      //console.log("StorePreset (preset-browser) - media item:\n%s",
      //  JSON.stringify(mediaItem, null, 2),
      //);

      if (mediaItem.PresetId) {

        // store the preset.
        await this.soundTouchPlusService.RemoteKeyPress(this.player.id, "PRESET_" + JSON.stringify(mediaItem.PresetId), "press");

        // don't show the player here, as the user is storing a preset.

      }

    }
    catch (error) {

      this._alertErrorSet((error as Error).message);

    }

  }


  /**
   * Updates the `mediaList` attribute with the most current list of presets from
   * the SoundTouch device.  
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

      // update our media list; we will force the `mediaListLastUpdatedOn` attribute to
      // match the device `soundtouchplus_presets_lastupdated` attribute so that the
      // refresh is only triggered once on the attribute change (or initial request).
      this.mediaListLastUpdatedOn = player.attributes.soundtouchplus_presets_lastupdated || (Date.now() / 1000);

      // if card is being edited, then we will use the cached media list as the data source;
      // otherwise, we will refresh the media list from the real-time source.
      const cacheKey = 'preset-browser';
      this.mediaList = undefined;
      const isCardEditMode = isCardInEditPreview(this.store.card);
      if ((isCardEditMode) && (cacheKey in Card.mediaListCache)) {
        this.mediaList = Card.mediaListCache[cacheKey] as PresetList;
        this.isUpdateInProgress = false;
        super.requestUpdate();
        //console.log("%c updateMediaList (preset-browser) - medialist loaded from cache",
        //  "color: orange;",
        //);
        return;
      }

      //console.log("%c updateMediaList (preset-browser) - updating medialist",
      //  "color: orange;",
      //);

      // update status.
      this._alertInfo = "Refreshing media list ...";

      // call the service to retrieve the media list.
      this.soundTouchPlusService.PresetList(player.id, true)
        .then(result => {

          this.mediaList = result;
          this.mediaListLastUpdatedOn = result.LastUpdatedOn || (Date.now() / 1000);
          this.isUpdateInProgress = false;
          this._alertClear();

          //const playerLastUpdatedOn = (this.player.attributes.soundtouchplus_presets_lastupdated || 0);
          //console.log("%c preset-browser - updateMediaList info AFTER update:\n- player id = %s\n- %s = player.soundtouchplus_presets_lastupdated\n- %s = playerLastUpdatedOn\n- %s = mediaListLastUpdatedOn",
          //  "color: green;",
          //  this.player.id,
          //  this.player.attributes.soundtouchplus_presets_lastupdated,
          //  playerLastUpdatedOn,
          //  this.mediaListLastUpdatedOn);

          // if editing the card then store the list in the cache for next time.
          if ((isCardEditMode) && !(cacheKey in Card.mediaListCache)) {
            Card.mediaListCache[cacheKey] = this.mediaList;
          }

          // if no items then update status.
          if ((this.mediaList) && (this.mediaList.Presets?.length == 0)) {
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