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
import { ITEM_SELECTED } from '../constants';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { CardConfig } from '../types/cardconfig'
import { Recent } from '../types/soundtouchplus/recent';
import { RecentList } from '../types/soundtouchplus/recentlist';

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

  /** Date and time (in epoch format) of when the media list was last updated. */
  private medialistLastUpdatedOn!: number;

  /** SoundTouchPlus device recent list. */
  private recentList!: RecentList;

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
  */
  protected render(): TemplateResult | void {

    try {

      //console.log(LOGPFX + "render()\n Rendering recent browser html");

      // set common references from application common storage area.
      this.hass = this.store.hass
      this.config = this.store.config;
      this.player = this.store.player;
      this.soundTouchPlusService = this.store.soundTouchPlusService;

      // if entity value not set then render an error card.
      if (!this.player)
        throw new Error("SoundTouchPlus media player entity id not configured");

      // was the media player recent list updated?
      const playerLastUpdatedOn = (this.player.attributes.soundtouchplus_recents_lastupdated || 0);
      console.log("%c recent-browser render - updateMediaList check info BEFORE update:\n %s=playerLastUpdatedOn\n %s=medialistLastUpdatedOn", "color: green;", JSON.stringify(playerLastUpdatedOn), JSON.stringify(this.medialistLastUpdatedOn));
      if ((playerLastUpdatedOn != this.medialistLastUpdatedOn) && (this.medialistLastUpdatedOn > 0))
        this.updateMediaList(this.player);

      //console.log(LOGPFX + "render()\n RecentList.LastUpdatedOn=%s", this.recentList ? this.recentList.LastUpdatedOn : "unknown");
      //console.log(LOGPFX + "render()\n this.recentList='%s'", JSON.stringify(this.recentList));

      // format title and sub-title details.
      const title = formatPlayerInfo(this.player, this.config.recentBrowserTitle);
      const subtitle = formatPlayerInfo(this.player, this.config.recentBrowserSubTitle);

      return html`
        ${title ? html`<div class="title">${title}</div>` : html``}
        ${subtitle ? html`<div class="subtitle">${subtitle}</div>` : html``}
        ${
        (() => {
          if (!this.recentList) {
            //console.log("%c render() !this.recentList.Recents", "color: green;");
            return (
              html`<div class="no-items">No recently played items found</div>`
            )
          } else if (this.config.recentBrowserItemsPerRow === 1) {
            //console.log("%c render() this.config.recentBrowserItemsPerRow === 1", "color: green;");
            return (
              html`<stpc-media-browser-list
                  .items=${this.recentList?.Recents}
                  .store=${this.store}
                  @item-selected=${this.OnItemSelected}
                  ></stpc-media-browser-list>
                  `
            )
          } else {
            //console.log("%c render() this.config.recentBrowserItemsPerRow > 1", "color: green;");
            return (
              html`<stpc-media-browser-icons
                  .items=${this.recentList?.Recents}
                  .store=${this.store}
                  @item-selected=${this.OnItemSelected}
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
    //  console.log("STPC - Error rendering recent browser html\n Name = '%s'\nMessage = %s", exObj.name, exObj.message);
    //  return html`Could not render card - check console log`;

    } finally {
    }
  }


  /**
   * Handles the `item-selected` event fired when a media browser item is clicked.
   * This will select the media browser item for playing.
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
      await this.soundTouchPlusService.PlayContentItem(this.player.id, mediaItem.ContentItem);
    }
  }


  /**
   * Updates the `recentList` attribute with the most current list of recents from
   * the SoundTouch device.  
   * 
   * This method is called when the section is initially displayed, as well as when
   * a recent updated event occurs for the media player.
   */
  private updateMediaList(player: MediaPlayer): void {

    // update our media list; we will force the `medialistLastUpdatedOn` attribute to
    // match the device `soundtouchplus_recents_lastupdated` attribute so that the
    // refresh is only triggered once on the attribute change (or initial request).
    this.medialistLastUpdatedOn = player.attributes.soundtouchplus_recents_lastupdated || 0;

    // call the service to retrieve the media list.
    this.soundTouchPlusService.RecentList(player.id)
      .then(result => {
        this.recentList = result;
        this.medialistLastUpdatedOn = result.LastUpdatedOn || 0;
        const playerLastUpdatedOn = (this.player.attributes.soundtouchplus_recents_lastupdated || 0);
        console.log("%c recent-browser render - updateMediaList check info AFTER update:\n %s=playerLastUpdatedOn\n %s=medialistLastUpdatedOn", "color: green;", JSON.stringify(playerLastUpdatedOn), JSON.stringify(this.medialistLastUpdatedOn));
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