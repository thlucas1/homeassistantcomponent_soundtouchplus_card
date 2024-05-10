// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';

// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import { Store } from '../model/store';
import { customEvent } from '../utils/utils';
import { formatPlayerInfo } from '../utils/media-browser-utils';
import { MediaPlayer } from '../model/media-player';
import { ITEM_SELECTED, ITEM_SELECTED_WITH_HOLD } from '../constants';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { CardConfig } from '../types/cardconfig'
import { Preset } from '../types/soundtouchplus/preset';
import { PresetList } from '../types/soundtouchplus/presetlist';

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

  /** Date and time (in epoch format) of when the media list was last updated. */
  private medialistLastUpdatedOn!: number;

  /** SoundTouchPlus device preset list. */
  private mediaList!: PresetList;

  /** SoundTouchPlus services instance. */
  private soundTouchPlusService!: SoundTouchPlusService;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // initialize storage.
    super();

    // force refresh first time.
    this.medialistLastUpdatedOn = 1;  
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

    try {

      //console.log(LOGPFX + "render()\n Rendering preset browser html");

      // set common references from application common storage area.
      this.hass = this.store.hass
      this.config = this.store.config;
      this.player = this.store.player;
      this.soundTouchPlusService = this.store.soundTouchPlusService;

      // if entity value not set then render an error card.
      if (!this.player)
        throw new Error("SoundTouchPlus media player entity id not configured");

      // was the media player preset list updated?
      const playerLastUpdatedOn = (this.player.attributes.soundtouchplus_presets_lastupdated || 0);
      console.log("%c preset-browser render - updateMediaList check info BEFORE update:\n %s=playerLastUpdatedOn\n %s=medialistLastUpdatedOn", "color: green;", JSON.stringify(playerLastUpdatedOn), JSON.stringify(this.medialistLastUpdatedOn));
      if ((playerLastUpdatedOn != this.medialistLastUpdatedOn) && (this.medialistLastUpdatedOn > 0))
        this.updateMediaList(this.player);
      
      //console.log(LOGPFX + "render()\n PresetList.LastUpdatedOn=%s", this.mediaList ? this.mediaList.LastUpdatedOn : "unknown");
      //console.log(LOGPFX + "render()\n this.mediaList='%s'", JSON.stringify(this.mediaList));

      // format title and sub-title details.
      const title = formatPlayerInfo(this.player, this.config.presetBrowserTitle);
      const subtitle = formatPlayerInfo(this.player, this.config.presetBrowserSubTitle);

      return html`
        ${title ? html`<div class="title">${title}</div>` : html``}
        ${subtitle ? html`<div class="subtitle">${subtitle}</div>` : html``}
        ${
        (() => {
          if (!this.mediaList) {
            //console.log("%c render() !this.mediaList.Presets", "color: green;");
            return (
              html`<div class="no-items">No presets found</div>`
            )
          } else if (this.config.presetBrowserItemsPerRow === 1) {
            //console.log("%c render() this.config.presetBrowserItemsPerRow === 1", "color: green;");
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
            //console.log("%c render() this.config.presetBrowserItemsPerRow > 1", "color: green;");
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
      `;

    //} catch (ex) {

    //  // log exceptions.
    //  const exObj = (ex as Error);
    //  console.log("STPC - Error rendering preset browser html\n Name = '%s'\nMessage = %s", exObj.name, exObj.message);
    //  return html`Could not render card - check console log`;

    } finally {
    }
  }


  /**
   * Handles the `item-selected` event fired when a media browser item is clicked.
   * 
   * This will select the media browser item for playing.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected OnItemSelected = (args: CustomEvent) => {
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
    if (mediaItem.PresetId) {
      await this.soundTouchPlusService.RemoteKeyPress(this.player.id, "PRESET_" + JSON.stringify(mediaItem.PresetId), "release");
    }
  }


  /**
   * Calls the SoundTouchPlusService RemoteKeyPress method to store a preset.
   * 
   * @param mediaItem The Preset item that was selected.
   */
  private async StorePreset(mediaItem: Preset) {
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

    // update our media list; we will force the `medialistLastUpdatedOn` attribute to
    // match the device `soundtouchplus_presets_lastupdated` attribute so that the
    // refresh is only triggered once on the attribute change (or initial request).
    this.medialistLastUpdatedOn = player.attributes.soundtouchplus_presets_lastupdated || 0;

    // call the service to retrieve the media list.
    this.soundTouchPlusService.PresetList(player.id, true)
      .then(result => {
        //if (player.attributes.media_title == 'I Need You') {   // TEST TODO test for invalid lastupdatedon
        //  console.log("updateMediaList() - resetting result.LastUpdatedOn to undefined TEST TODO REMOVE ME");
        //  result.LastUpdatedOn = undefined;                   // TEST TODO
        //}                                                     // TEST TODO
        this.mediaList = result;
        this.medialistLastUpdatedOn = result.LastUpdatedOn || 0;
        const playerLastUpdatedOn = (this.player.attributes.soundtouchplus_presets_lastupdated || 0);
        console.log("%c preset-browser render - updateMediaList check info AFTER update:\n %s=playerLastUpdatedOn\n %s=medialistLastUpdatedOn", "color: green;", JSON.stringify(playerLastUpdatedOn), JSON.stringify(this.medialistLastUpdatedOn));
        this.requestUpdate();
      });
  }


  /** 
   * style definitions used by this section. 
   * */
  static get styles() {
    return css`
      //:host {
      //  display: flex;
      //  justify-content: space-between;
      //  padding: 0.5rem;
      //}

      .title {
        margin: 0.1rem 0;
        text-align: center;
        font-weight: bold;
        font-size: 1.0rem;
        color: var(--secondary-text-color);
      }

      .subtitle {
        margin: 0.1rem 0;
        text-align: center;
        font-weight: normal;
        font-size: 0.85rem;
        color: var(--secondary-text-color);
      }

      *[hide] {
        display: none;
      }

      .no-items {
        text-align: center;
        margin-top: 2rem;
      }
    `;
  }
}