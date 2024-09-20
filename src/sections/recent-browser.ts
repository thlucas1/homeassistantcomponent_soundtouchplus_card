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
import { ITEM_SELECTED } from '../constants';
import { Recent } from '../types/soundtouchplus/recent';
import { RecentList } from '../types/soundtouchplus/recent-list';


@customElement("stpc-recent-browser")
export class RecentBrowser extends LitElement {

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

  /** SoundTouchPlus device recent list. */
  private mediaList!: RecentList | undefined;

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

    //console.log("render (recent-browser) - rendering control\n- mediaListLastUpdatedOn=%s",
    //  JSON.stringify(this.mediaListLastUpdatedOn)
    //);

    // set common references from application common storage area.
    this.hass = this.store.hass
    this.config = this.store.config;
    this.player = this.store.player;
    this.soundTouchPlusService = this.store.soundTouchPlusService;

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.recentBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList?.Recents);
    const subtitle = formatTitleInfo(this.config.recentBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList?.Recents);

    return html`
      <div class="recent-browser-section">
        ${title ? html`<div class="recent-browser-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="recent-browser-subtitle">${subtitle}</div>` : html``}
        <div class="recent-browser-content">
          ${this._alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this._alertErrorClear}>${this._alertError}</ha-alert>` : ""}
          ${this._alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this._alertInfoClear}>${this._alertInfo}</ha-alert>` : ""}
          ${(() => {
            if (this.config.recentBrowserItemsPerRow === 1) {
              return (
                html`<stpc-media-browser-list
                      .items=${this.mediaList?.Recents}
                      .store=${this.store}
                      @item-selected=${this.OnItemSelected}
                    ></stpc-media-browser-list>`
              )
            } else {
              return (
                html`<stpc-media-browser-icons
                      .items=${this.mediaList?.Recents}
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

    // did the recents list change on the device?
    // if so, then refresh the media list to reflect it.
    if (!this.isUpdateInProgress) {
      if ((this.mediaList) && ((this.mediaList.LastUpdatedOn || 0) > 0)) {
        if ((this.player.attributes.soundtouchplus_recents_cache_lastupdated || 0) > (this.mediaList.LastUpdatedOn || 0)) {

          //console.log("render (recent-browser) - soundtouchplus_recents_cache_lastupdated changed, refreshing media list\n- %s = mediaListLastUpdatedOn\n- %s = soundtouchplus_recents_cache_lastupdated",
          //  JSON.stringify(this.mediaListLastUpdatedOn),
          //  JSON.stringify(this.player.attributes.soundtouchplus_recents_cache_lastupdated),
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

    //console.log("OnItemSelected (recent-browser) - media item selected:\n%s",
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
  private async PlayItem(mediaItem: Recent) {

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
   * Updates the `mediaList` attribute with the most current list of recents from
   * the SoundTouch device.  
   */
  private updateMediaList(player: MediaPlayer): void {

    // check for conditions that prevent the content from showing.
    if (!this.player.attributes.soundtouchplus_recents_cache_enabled) {
      this._alertErrorSet('Recents cache disabled in "' + this.player.name + '" configuration');
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

      // update our media list; we will force the `mediaListLastUpdatedOn` attribute to
      // match the device `soundtouchplus_recents_cache_lastupdated` attribute so that the
      // refresh is only triggered once on the attribute change (or initial request).
      this.mediaListLastUpdatedOn = player.attributes.soundtouchplus_recents_cache_lastupdated || (Date.now() / 1000);

      // if card is being edited, then we will use the cached media list as the data source;
      // otherwise, we will refresh the media list from the real-time source.
      const cacheKey = 'recent-browser';
      this.mediaList = undefined;
      const isCardEditMode = isCardInEditPreview(this.store.card);
      if ((isCardEditMode) && (cacheKey in Card.mediaListCache)) {
        this.mediaList = Card.mediaListCache[cacheKey] as RecentList;
        this.isUpdateInProgress = false;
        super.requestUpdate();
        //console.log("%c updateMediaList (recent-browser) - medialist loaded from cache",
        //  "color: orange;",
        //);
        return;
      }

      //console.log("%c updateMediaList (recent-browser) - updating medialist",
      //  "color: orange;",
      //);

      // update status.
      this._alertInfo = "Refreshing media list ...";

      // call the service to retrieve the media list.
      this.soundTouchPlusService.RecentListCache(player.id)
        .then(result => {

          this.mediaList = result;
          this.mediaListLastUpdatedOn = result.LastUpdatedOn || (Date.now() / 1000);
          this.isUpdateInProgress = false;
          this._alertClear();

          //const playerLastUpdatedOn = (this.player.attributes.soundtouchplus_recents_cache_lastupdated || 0);
          //console.log("%c recent-browser - updateMediaList info AFTER update:\n- player id = %s\n- %s = player.soundtouchplus_recents_cache_lastupdated\n- %s = playerLastUpdatedOn\n- %s = mediaListLastUpdatedOn",
          //  "color: green;",
          //  this.player.id,
          //  this.player.attributes.soundtouchplus_recents_cache_lastupdated,
          //  playerLastUpdatedOn,
          //  this.mediaListLastUpdatedOn);

          // if editing the card then store the list in the cache for next time.
          if ((isCardEditMode) && !(cacheKey in Card.mediaListCache)) {
            Card.mediaListCache[cacheKey] = this.mediaList;
          }

          // if no items then update status.
          if ((this.mediaList) && (this.mediaList.Recents?.length == 0)) {
            this._alertInfo = "No items found";
          }

        })
        .catch(error => {

          // a console `uncaught exception` will be is logged if an exception gets thrown in this catch block!

          // clear results due to error and update status.
          this.mediaList = undefined;
          this.mediaListLastUpdatedOn = 0;
          this.isUpdateInProgress = false;
          this._alertErrorSet("Recently Played refresh failed: \n" + error.message);

        });

    } catch (error) {

      // update status.
      this.isUpdateInProgress = false;
      this._alertErrorSet("Recently Played refresh failed: " + error);

    } finally {
    }
  }
}