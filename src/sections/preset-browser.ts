// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';

// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import { Card } from '../card';
import { Store } from '../model/store';
import { customEvent, isCardInEditPreview } from '../utils/utils';
import { formatTitleInfo } from '../utils/media-browser-utils';
import { MediaPlayer } from '../model/media-player';
import { ITEM_SELECTED, ITEM_SELECTED_WITH_HOLD, SECTION_SELECTED } from '../constants';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { CardConfig } from '../types/cardconfig'
import { Preset } from '../types/soundtouchplus/preset';
import { PresetList } from '../types/soundtouchplus/presetlist';
import { Section } from '../types/section';

//const LOGPFX = "STPC - sections/preset-browser."

export class PresetBrowser extends LitElement {

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

    // if entity value not set then render an error card.
    if (!this.player)
      throw new Error("SoundTouchPlus media player entity id not configured");

    // does the medialist need refreshing?
    const playerLastUpdatedOn = (this.player.attributes.soundtouchplus_presets_lastupdated || 0);
    if ((this.mediaListLastUpdatedOn == -1) || (playerLastUpdatedOn > this.mediaListLastUpdatedOn)) {
      if (!this.isUpdateInProgress) {
        this.isUpdateInProgress = true;
        this.updateMediaList(this.player);
      } else {
        //console.log("%c preset-browser - update already in progress!", "color: orange;");
      }
    }
      
    // format title and sub-title details.
    const title = formatTitleInfo(this.config.presetBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList?.Presets);
    const subtitle = formatTitleInfo(this.config.presetBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList?.Presets);

    // check for conditions that prevent the content from showing.
    let alertText = undefined
    if (!this.mediaList) {
      alertText = 'No SoundTouch Presets found';
    }

    // render html.
    return html`
      <div class="preset-browser-section">
        ${title ? html`<div class="preset-browser-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="preset-browser-subtitle">${subtitle}</div>` : html``}
        <div class="preset-browser-content">
          ${
          (() => {
            if (alertText) {
              return (
                html`<div class="no-items">${alertText}</div>`
              )
            } else if (this.config.presetBrowserItemsPerRow === 1) {
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

    //console.log("SelectPreset (pandora-browser) - media item:\n%s",
    //  JSON.stringify(mediaItem, null, 2),
    //);

    if (mediaItem.PresetId) {

      // play the content.
      await this.soundTouchPlusService.RemoteKeyPress(this.player.id, "PRESET_" + JSON.stringify(mediaItem.PresetId), "release");

      // show the player section (only shown if it's active).
      const event = customEvent(SECTION_SELECTED, Section.PLAYER);
      window.dispatchEvent(event);
    }
  }


  /**
   * Calls the SoundTouchPlusService RemoteKeyPress method to store a preset.
   * 
   * @param mediaItem The Preset item that was selected.
   */
  private async StorePreset(mediaItem: Preset) {

    //console.log("StorePreset (pandora-browser) - media item:\n%s",
    //  JSON.stringify(mediaItem, null, 2),
    //);

    if (mediaItem.PresetId) {
      await this.soundTouchPlusService.RemoteKeyPress(this.player.id, "PRESET_" + JSON.stringify(mediaItem.PresetId), "press");
    }

  }


  /**
   * Updates the `mediaList` attribute with the most current list of presets from
   * the SoundTouch device.  
   * 
   * This method is called when the section is initially displayed, as well as when
   * a preset updated event occurs for the media player.  This can be driven from
   * the SoundTouch App (e.g. when a preset is stored in the app), as well as when
   * a physical preset is stored on the device (e.g. press and hold a preset button).
   */
  private updateMediaList(player: MediaPlayer): void {

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

      //console.log("%c updateMediaList (preset-browser) - medialist loaded from cache",
      //  "color: orange;",
      //);

      this.mediaList = Card.mediaListCache[cacheKey] as PresetList;
      this.isUpdateInProgress = false;
      this.requestUpdate();
      return;
    }

    //console.log("%c updateMediaList (preset-browser) - updating medialist",
    //  "color: orange;",
    //);

    // call the service to retrieve the media list.
    this.soundTouchPlusService.PresetList(player.id, true)
      .then(result => {

        this.mediaList = result;
        this.mediaListLastUpdatedOn = result.LastUpdatedOn || (Date.now() / 1000);
        this.isUpdateInProgress = false;
        this.requestUpdate();

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
        //console.log("%c updateMediaList (preset-browser) - medialist stored to cache",
        //  "color: orange;",
        //);
        }

      });
  }
}