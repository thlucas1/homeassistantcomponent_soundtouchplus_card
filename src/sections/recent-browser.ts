// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';

// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import { Store } from '../model/store';
import { customEvent } from '../utils/utils';
import { formatTitleInfo } from '../utils/media-browser-utils';
import { MediaPlayer } from '../model/media-player';
import { ITEM_SELECTED, SECTION_SELECTED } from '../constants';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { CardConfig } from '../types/cardconfig'
import { Recent } from '../types/soundtouchplus/recent';
import { RecentList } from '../types/soundtouchplus/recentlist';
import { Section } from '../types/section';

//const LOGPFX = "STPC - sections/recent-browser."

export class RecentBrowser extends LitElement {

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

  /** SoundTouchPlus device recent list. */
  private mediaList!: RecentList;

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

    //console.log(LOGPFX + "render()\n Rendering recent browser html");

    // set common references from application common storage area.
    this.hass = this.store.hass
    this.config = this.store.config;
    this.player = this.store.player;
    this.soundTouchPlusService = this.store.soundTouchPlusService;

    // if entity value not set then render an error card.
    if (!this.player)
      throw new Error("SoundTouchPlus media player entity id not configured");

    // was the media player recent list cache updated?
    const playerLastUpdatedOn = (this.player.attributes.soundtouchplus_recents_cache_lastupdated || 0);
    //console.log("%c recent-browser - updateMediaList info BEFORE update:\n player id=%s\n %s=player.stp_recents_cache_lastupdated\n %s=playerLastUpdatedOn\n %s=mediaListLastUpdatedOn",
    //  "color: green;",
    //  this.player.id,
    //  this.player.attributes.soundtouchplus_recents_cache_lastupdated,
    //  playerLastUpdatedOn,
    //  this.mediaListLastUpdatedOn);
    if ((this.mediaListLastUpdatedOn == -1) || (playerLastUpdatedOn > this.mediaListLastUpdatedOn)) {
      if (!this.isUpdateInProgress) {
        this.isUpdateInProgress = true;
        this.updateMediaList(this.player);
      } else {
        //console.log("%c recent-browser - update already in progress!", "color: orange;");
      }
    }

    //console.log(LOGPFX + "render()\n RecentList.LastUpdatedOn=%s", this.mediaList ? this.mediaList.LastUpdatedOn : "unknown");
    //console.log(LOGPFX + "render()\n this.mediaList='%s'", JSON.stringify(this.mediaList));

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.recentBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList?.Recents);
    const subtitle = formatTitleInfo(this.config.recentBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList?.Recents);

    // check for conditions that prevent the content from showing.
    let alertText = undefined 
    if (!this.mediaList) {
      alertText = 'No recently played items found';
    } else if (!this.player.attributes.soundtouchplus_recents_cache_enabled) {
      alertText = 'Recents cache disabled in "' + this.player.name + '" configuration';
    }

    return html`
      <div class="recent-browser-section">
        ${title ? html`<div class="recent-browser-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="recent-browser-subtitle">${subtitle}</div>` : html``}
        <div class="recent-browser-content">
          ${
          (() => {
            if (alertText) {
              return (
                html`<div class="no-items">${alertText}</div>`
              )
            } else if (this.config.recentBrowserItemsPerRow === 1) {
              return (
                html`<stpc-media-browser-list
                    .items=${this.mediaList?.Recents}
                    .store=${this.store}
                    @item-selected=${this.OnItemSelected}
                    ></stpc-media-browser-list>
                    `
              )
            } else {
              return (
                html`<stpc-media-browser-icons
                    .items=${this.mediaList?.Recents}
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

      .recent-browser-section {
        color: var(--secondary-text-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .recent-browser-title {
        margin-top: 0.5rem;
        text-align: center;
        font-weight: bold;
        font-size: 1.0rem;
        color: var(--secondary-text-color);
      }

      .recent-browser-subtitle {
        margin: 0.1rem 0;
        text-align: center;
        font-weight: normal;
        font-size: 0.85rem;
        color: var(--secondary-text-color);
      }

      .recent-browser-content {
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
    const mediaItem = args.detail;
    this.PlayItem(mediaItem);
    this.dispatchEvent(customEvent(ITEM_SELECTED, mediaItem));
  };


  /**
   * Calls the SoundTouchPlusService PlayContentItem method to play media.
   * 
   * @param mediaItem The Recent item that was selected.
   */
  private async PlayItem(mediaItem: Recent) {

    if (mediaItem.ContentItem) {

      // play the content.
      await this.soundTouchPlusService.PlayContentItem(this.player.id, mediaItem.ContentItem);

      // show the player section (only shown if it's active).
      const event = customEvent(SECTION_SELECTED, Section.PLAYER);
      window.dispatchEvent(event);
    }
  }


  /**
   * Updates the `mediaList` attribute with the most current list of recents from
   * the SoundTouch device.  
   * 
   * This method is called when the section is initially displayed, as well as when
   * a recent updated event occurs for the media player.
   */
  private updateMediaList(player: MediaPlayer): void {

    // update our media list; we will force the `mediaListLastUpdatedOn` attribute to
    // match the device `soundtouchplus_recents_cache_lastupdated` attribute so that the
    // refresh is only triggered once on the attribute change (or initial request).
    this.mediaListLastUpdatedOn = player.attributes.soundtouchplus_recents_cache_lastupdated || (Date.now() / 1000);

    // call the service to retrieve the media list.
    this.soundTouchPlusService.RecentListCache(player.id)
      .then(result => {
        this.mediaList = result;
        this.mediaListLastUpdatedOn = result.LastUpdatedOn || (Date.now() / 1000);
        this.isUpdateInProgress = false;
        //const playerLastUpdatedOn = (this.player.attributes.soundtouchplus_recents_cache_lastupdated || 0);
        //console.log("%c recent-browser - updateMediaList info AFTER update:\n player id=%s\n %s=player.stp_recents_cache_lastupdated\n %s=playerLastUpdatedOn\n %s=mediaListLastUpdatedOn",
        //  "color: green;",
        //  this.player.id,
        //  this.player.attributes.soundtouchplus_recents_cache_lastupdated,
        //  playerLastUpdatedOn,
        //  this.mediaListLastUpdatedOn);
        this.requestUpdate();
      });
  }
}