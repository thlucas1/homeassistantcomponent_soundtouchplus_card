// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":fav-browser-base");

// lovelace card imports.
import { css, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap, StyleInfo } from 'lit-html/directives/style-map.js';
import { HomeAssistant } from '../types/home-assistant-frontend/home-assistant';
import {
  mdiArrowLeft,
  mdiRefresh,
} from '@mdi/js';

// our imports.
import { sharedStylesFavBrowser } from '../styles/shared-styles-fav-browser.js';
import { CardConfig } from '../types/card-config';
import { Section } from '../types/section';
import { Store } from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { storageService } from '../decorators/storage';
import { truncateMediaList } from '../utils/media-browser-utils';
import { getHomeAssistantErrorMessage, loadHaFormLazyControls } from '../utils/utils';
import { FilterSectionMediaEventArgs } from '../events/filter-section-media';
import { DOMAIN_SOUNDTOUCHPLUS } from '../constants';
import { AlertUpdatesBase } from './alert-updates-base';

/** Keys used to access cached storage items. */
const CACHE_KEY_FILTER_CRITERIA = "_filtercriteria";
const CACHE_KEY_MEDIA_LIST = "_medialist";
const CACHE_KEY_MEDIA_LIST_LAST_UPDATED = "_medialistlastupdated";

const ERROR_REFRESH_IN_PROGRESS = "Previous refresh is still in progress - please wait";


export class FavBrowserBase extends AlertUpdatesBase {

  // public state properties.
  @property({ attribute: false }) public hass!: HomeAssistant;

  // private state properties.
  @state() protected isActionsEnabled?: boolean;
  @state() protected isActionsVisible?: boolean;
  @state() protected isMediaListRefreshedOnSectionEntry?: boolean;
  @state() protected scrollTopSaved?: number;
  @state() protected mediaItem?: any;
  @state() protected filterCriteria?: string;
  @state() protected isFilterCriteriaReadOnly?: boolean | null;
  @state() protected isFilterCriteriaVisible?: boolean | null;

  // html form element objects.
  @query("#mediaBrowserContentElement", true) protected mediaBrowserContentElement!: HTMLDivElement;
  @query("#filterCriteria", true) protected filterCriteriaElement!: HTMLElement;

    /** Card configuration data. */
  protected config!: CardConfig;

  /** MediaPlayer instance created from the configuration entity id. */
  protected player!: MediaPlayer;

  /** Date and time (in epoch format) of when the media list was last updated. */
  protected mediaListLastUpdatedOn!: number;

  /** Array of items to display in the media list. */
  protected mediaList!: Array<any> | undefined;

  /** Type of media being accessed. */
  protected mediaType!: Section;

  /** Filter criteria placeholder value. */
  protected filterCriteriaPlaceholder?: string;

  /** Filter item count. */
  protected filterItemCount?: number;

  /** Enable shuffle prior to play. */
  protected shuffleOnPlay?: boolean;

  /** SpotifyPlus services instance. */
  protected soundTouchPlusService!: SoundTouchPlusService;

  /** Base key used to access cached storage items. */
  protected cacheKeyBase?: string;

  /** Max number of items to return for a media list while editing the card configuration. */
  protected EDITOR_LIMIT_TOTAL_MAX = 25;

  /** Max number of items to return for a media list (200). */
  protected LIMIT_TOTAL_MAX = 200;

  protected filterCriteriaHtml;
  protected filterCriteriaReadOnlyHtml;
  protected refreshMediaListHtml;
  protected btnHideActionsHtml;

  // bound event listeners for event handlers that need access to "this" object.
  private onKeyDown_EventListenerBound;


  /**
   * Initializes a new instance of the class.
   * 
   * @mediaType Type of media section that is being displayed.
   */
  constructor(mediaType: Section) {

    // invoke base class method.
    super();

    // initialize storage.
    this.isActionsEnabled = true;
    this.isMediaListRefreshedOnSectionEntry = false;
    this.mediaType = mediaType;
    this.shuffleOnPlay = false;

    // create bound event listeners for event handlers that need access to "this" object.
    this.onKeyDown_EventListenerBound = this.onKeyDown.bind(this);

  }


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    if (debuglog.enabled) {
      debuglog("render - rendering control: %s\n- mediaListLastUpdatedOn = %s\n- scrollTopSaved = %s\n- filterItemCount = %s (pre-render)",
        JSON.stringify(this.mediaType),
        JSON.stringify(this.mediaListLastUpdatedOn),
        JSON.stringify(this.scrollTopSaved),
        JSON.stringify(this.filterItemCount),
      );
    }

    // set common references from application common storage area.
    this.hass = this.store.hass
    this.config = this.store.config;
    this.player = this.store.player;
    this.soundTouchPlusService = this.store.soundTouchPlusService;

    // set scroll position (if needed).
    this.setScrollPosition();

    // enable filter criteria (by default).
    this.isFilterCriteriaReadOnly = false;
    this.isFilterCriteriaVisible = true;

    // define control to render - search criteria.
    this.filterCriteriaHtml = html`
      <search-input-outlined id="filterCriteria" 
        class="media-browser-control-filter"
        .hass=${this.hass}
        .filter=${this.filterCriteria}
        .value=${this.filterCriteria}
        .autofocus=true
        placeholder=${this.filterCriteriaPlaceholder || "search by name"}
        @value-changed=${this.onFilterCriteriaChange}
        @keypress=${this.onFilterCriteriaKeyPress}
      ></search-input-outlined>
      `;

    // define control to render - search criteria (readonly).
    this.filterCriteriaReadOnlyHtml = html`
      <span id="filterCriteriaDisabled" 
        class="media-browser-control-filter-disabled"
      >${this.filterCriteria}</span>
      `;

    // define control to render - search icon.
    this.refreshMediaListHtml = html`
      <ha-icon-button
        slot="refresh-button"
        label="Refresh Media List"
        action="refresh"
        .path=${mdiRefresh}
        @click=${this.onFilterActionsClick}
      ></ha-icon-button>
      `;

    // define control to render - back icon.
    this.btnHideActionsHtml = html`
      <ha-icon-button
        style="margin-right: 0.25rem;"
        slot="back-button"
        label="Back to Media List"
        action="hideactions"
        .path=${mdiArrowLeft}
        @click=${this.onFilterActionsClick}
      ></ha-icon-button>
      `;

    // all html is rendered in the inheriting class.
  }


  /**
   * Returns a style map for media browser item theming.
   */
  protected styleMediaBrowser() {

    // load card configuration theme settings.
    const mediaBrowserSectionTitleColor = this.config.mediaBrowserSectionTitleColor;
    const mediaBrowserSectionTitleFontSize = this.config.mediaBrowserSectionTitleFontSize;
    const mediaBrowserSectionSubTitleColor = this.config.mediaBrowserSectionSubTitleColor;
    const mediaBrowserSectionSubTitleFontSize = this.config.mediaBrowserSectionSubTitleFontSize;
    const mediaBrowserItemsSvgIconColor = this.config.mediaBrowserItemsSvgIconColor;

    // build style info object.
    const styleInfo: StyleInfo = <StyleInfo>{};
    if (mediaBrowserSectionTitleColor)
      styleInfo['--stpc-media-browser-section-title-color'] = `${mediaBrowserSectionTitleColor}`;
    if (mediaBrowserSectionTitleFontSize)
      styleInfo['--stpc-media-browser-section-title-font-size'] = `${mediaBrowserSectionTitleFontSize}`;
    if (mediaBrowserSectionSubTitleColor)
      styleInfo['--stpc-media-browser-section-subtitle-color'] = `${mediaBrowserSectionSubTitleColor}`;
    if (mediaBrowserSectionSubTitleFontSize)
      styleInfo['--stpc-media-browser-section-subtitle-font-size'] = `${mediaBrowserSectionSubTitleFontSize}`;
    if (mediaBrowserItemsSvgIconColor)
      styleInfo['--stpc-media-browser-items-svgicon-color'] = `${mediaBrowserItemsSvgIconColor}`;
    return styleMap(styleInfo);

  }


  /**
   * style definitions used by this component.
   * */
  static get styles() {

    return [
      sharedStylesFavBrowser,
      css`

      /* extra styles not defined in sharedStylesFavBrowser would go here. */

      /* you can also copy this method into any inheriting class to apply fav-browser specific styles. */
      `
    ];
  }




  /**
   * Invoked when the component is added to the document's DOM.
   *
   * In `connectedCallback()` you should setup tasks that should only occur when
   * the element is connected to the document. The most common of these is
   * adding event listeners to nodes external to the element, like a keydown
   * event handler added to the window.
   */
  public connectedCallback() {

    // invoke base class method.
    super.connectedCallback();

    // add document level event listeners.
    document.addEventListener("keydown", this.onKeyDown_EventListenerBound);

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
  public disconnectedCallback() {

    // remove document level event listeners.
    document.removeEventListener("keydown", this.onKeyDown_EventListenerBound);

    // invoke base class method.
    super.disconnectedCallback();
  }


  /**
   * Called when the element has rendered for the first time. Called once in the
   * lifetime of an element. Useful for one-time setup work that requires access to
   * the DOM.
   */
  protected firstUpdated(changedProperties: PropertyValues): void {

    // ** IMPORTANT **
    // if editing the card in the configuration editor ...
    // this method will fire every time the configuration changes!  for example, the
    // method will execute for every keystroke if you are typing something into a 
    // configuration editor field!

    // invoke base class method.
    super.firstUpdated(changedProperties);

    if (debuglog.enabled) {
      debuglog("%cfirstUpdated - changedProperties keys for mediaType %s:\n- %s",
        "color: yellow;",
        JSON.stringify(this.mediaType),
        JSON.stringify(Array.from(changedProperties.keys())),
      );
    }

    //if (debuglog.enabled) {
    //  debuglog("%cfirstUpdated - changedProperties keys for mediaType %s:\n- %s",
    //    "color: yellow;",
    //    JSON.stringify(this.mediaType),
    //    JSON.stringify(Array.from(changedProperties.keys())),
    //  );
    //}

    // ensure "<search-input-outlined>" and "<ha-md-button-menu>" HA customElements are
    // loaded so that the controls are rendered properly.
    (async () => await loadHaFormLazyControls())();

    // set storage cache key for the media player entity.
    // the prefix will include our domain, the media player entity id, and the storage key.
    // this allows us to maintain preferences for multiple entitys.
    this.cacheKeyBase = DOMAIN_SOUNDTOUCHPLUS + "_" + this.player.id + "_"

    // are we refreshing the media list on section entry?
    if (this.isMediaListRefreshedOnSectionEntry) {

      // ensure we are NOT editing the card configuration!
      // this is because the `firstUpdated` method will fire every time the configuration changes!
      // if we already updated the media list, then don't do it again.
      if (!this.isCardInEditPreview) {

        if (debuglog.enabled) {
          debuglog("%cfirstUpdated - %s mediaList will be updated on section entry",
            "color: yellow;",
            JSON.stringify(this.mediaType),
          );
        }

        // clear cached media list values (e.g. force refresh).
        this.storageValuesClear();
      }
    }

    // loads values from persistant storage.
    this.storageValuesLoad()

    // if cache was empty, then we will retrieve the media list via the `updateMediaList` method.
    if ((this.mediaListLastUpdatedOn || 0) == 0) {

      // if we are editing the card configuration, then we only want to do this one time!
      // this is because the `firstUpdated` method will fire every time the configuration changes!
      // if we already updated the media list, then don't do it again.
      if ((this.isCardInEditPreview) && (this.mediaType in Store.hasCardEditLoadedMediaList)) {
        if (debuglog.enabled) {
          debuglog("%cfirstUpdated - %s mediaList already updated; updateMediaList will not be called again while editing card configuration!",
            "color: yellow;",
            JSON.stringify(this.mediaType),
          );
        }
        return;
      }

      if (debuglog.enabled) {
        debuglog("%cfirstUpdated - %s mediaList will be updated on first update",
          "color: yellow;",
          JSON.stringify(this.mediaType),
        );
      }

      // refresh the medialist.
      this.updateMediaList(this.player);

    } else {

      // at this point, the media list was loaded from the cache.
      // if editing card configuration then truncate the media list so that the UI stays 
      // responsive while changes are being made; only display the truncation message once.
      if (this.isCardInEditPreview) {
        this.updatedMediaListOk(false);
      }

    }

  }


  /**
   * Execute filter based on passed arguments.
   */
  public filterSectionMedia(args: FilterSectionMediaEventArgs): void {

    if (debuglog.enabled) {
      debuglog("filterSectionMedia - filtering section media:\n%s",
        JSON.stringify(args, null, 2),
      );
    }

    // apply filter criteria.
    this.filterCriteria = args.filterCriteria;

    // update the media list, as the results are probably cached.
    this.updateMediaList(this.player);

  }


  /**
   * Clears values from persistant storage.
   */
  protected storageValuesClear() {

    // clear media list and supporting values from the cache.
    storageService.clearStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_MEDIA_LIST_LAST_UPDATED);
    storageService.clearStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_MEDIA_LIST);
    storageService.clearStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_FILTER_CRITERIA);

    // clear first time media list load for card editing logic.
    if (this.mediaType in Store.hasCardEditLoadedMediaList) {
      delete Store.hasCardEditLoadedMediaList[this.mediaType];
    }

    if (debuglog.enabled) {
      debuglog("storageValuesClear - %s parameters were cleared from cache:\n mediaListLastUpdatedOn, mediaList, filterCriteria",
        JSON.stringify(this.mediaType),
      );
    }

  }


  /**
   * Loads values from persistant storage.
   */
  protected storageValuesLoad() {

    // load media list and supporting values from the cache.
    this.mediaListLastUpdatedOn = storageService.getStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_MEDIA_LIST_LAST_UPDATED, 0);
    this.mediaList = storageService.getStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_MEDIA_LIST, undefined);
    this.filterCriteria = storageService.getStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_FILTER_CRITERIA, undefined);

    if (debuglog.enabled) {
      debuglog("storageValuesLoad - %s parameters were loaded from cache:\n mediaListLastUpdatedOn, mediaList, filterCriteria",
        JSON.stringify(this.mediaType),
      );
    }

  }


  /**
   * Saves values to persistant storage.
   */
  protected storageValuesSave() {

    // save media list and supporting values to the cache.
    storageService.setStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_MEDIA_LIST_LAST_UPDATED, this.mediaListLastUpdatedOn);
    storageService.setStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_MEDIA_LIST, this.mediaList);
    storageService.setStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_FILTER_CRITERIA, this.filterCriteria);

    if (debuglog.enabled) {
      debuglog("storageValuesSave - %s parameters were saved to cache:\n mediaListLastUpdatedOn, mediaList, filterCriteria",
        JSON.stringify(this.mediaType),
      );
    }

  }


  protected onFilterCriteriaChange(ev: CustomEvent) {

    // store search critera.
    this.filterCriteria = ev.detail.value;

    // if filter cleared, then clear cache as well.
    if (ev.detail.value == "") {
      storageService.clearStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_FILTER_CRITERIA);
    }

  }


  protected onFilterCriteriaKeyPress(ev) {

    // was ENTER pressed?  if so, then refresh the media list.
    if (ev.key === "Enter") {
      this.updateMediaList(this.player);
    }

  }


  /**
   * Handles the `click` event fired when the hide or refresh actions icon is clicked.
   * 
   * @param evArgs Event arguments that contain the icon that was clicked on.
   */
  protected onFilterActionsClick(ev: MouseEvent) {

    // get action to perform.
    const action = (ev.currentTarget! as HTMLElement).getAttribute("action")!;

    if (action === "refresh") {

      // clear cache if user chose to manually refresh the media list.
      this.storageValuesClear();

      // refresh the media list.
      this.updateMediaList(this.player);

    } else if (action === "hideactions") {

      // hide actions container.
      this.isActionsVisible = false;

      // set a timeout to re-apply media list items scroll position, as some of the shadowRoot
      // elements may not have completed updating when the re-render occured.
      setTimeout(() => {
        this.requestUpdate();
      }, 50);

    }

  }


  /**
   * Handles the `item-selected` event fired when a media browser item is clicked.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected onItemSelected(args: CustomEvent) {

    if (debuglog.enabled) {
      debuglog("onItemSelected - media item selected:\n%s",
        JSON.stringify(args.detail, null, 2),
      );
    }

    const mediaItem = args.detail;
    this.PlayMediaItem(mediaItem);

  }


  /**
   * Handles the `item-selected-with-hold` event fired when a media browser item is clicked and held.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected onItemSelectedWithHold(args: CustomEvent) {

    if (debuglog.enabled) {
      debuglog("onItemSelectedWithHold - media item selected:\n%s",
        JSON.stringify(args.detail, null, 2),
      );
    }

    // are actions enabled? if not, then treat it as an `item-selected` event.
    if (!this.isActionsEnabled) {
      this.onItemSelected(args);
      return;
    }

    // do not display actions if editing card configuration.
    if (this.isCardInEditPreview) {
      this.alertInfo = "Cannot display actions while editing card configuration";
      return;
    }

    // save the selected media item reference.
    this.mediaItem = args.detail;

    // save scroll position.
    this.scrollTopSaved = this.mediaBrowserContentElement.scrollTop;

    // toggle action visibility.
    this.isActionsVisible = !this.isActionsVisible;

    // clear any alerts if showing actions.
    if (this.isActionsVisible) {
      this.alertClear();
    }

  };


  /**
   * KeyDown event handler.
   * 
   * @ev Event arguments.
   */
  private onKeyDown(ev: KeyboardEvent) {

    // was ESCAPE pressed?
    if (ev.key === "Escape") {

      // hide actions container.
      this.isActionsVisible = false;

      // set a timeout to re-apply media list items scroll position, as some of the shadowRoot
      // elements may not have completed updating when the re-render occured.
      setTimeout(() => {
        this.requestUpdate();
      }, 50);
    }

  }


  /**
   * Calls the SoundTouchPlusService PlayContentItem method to play media.
   * 
   * @param mediaItem The medialist item that was selected.
   */
  protected async PlayMediaItem(mediaItem: any): Promise<void> {

    try {

      // show progress indicator.
      this.progressShow();

      if (debuglog.enabled) {
        debuglog("PlayMediaItem \n- shuffleOnPlay = %s\n- player.attributes.shuffle = %s",
          JSON.stringify(this.shuffleOnPlay),
          JSON.stringify(this.player.attributes.shuffle),
        );
      }

      // enable shuffle prior to play if section is configured to do so and shuffle is currently false.
      if ((this.shuffleOnPlay) && (!this.player.attributes.shuffle)) {
        await this.store.mediaControlService.shuffle_set(this.player, true);
      }

      // play media item.
      await this.soundTouchPlusService.PlayContentItem(this.player, mediaItem.ContentItem);

      // show player section.
      this.store.card.SetSection(Section.PLAYER);

    }
    catch (error) {

      // set error message and reset scroll position to zero so the message is displayed.
      this.alertErrorSet("Could not play media item.  " + getHomeAssistantErrorMessage(error));
      this.mediaBrowserContentElement.scrollTop = 0;

    }
    finally {

      // hide progress indicator.
      this.progressHide();

    }
  }


  /**
   * Sets the scroll position on the media list content container.
   */
  protected setScrollPosition() {

    // are actions displayed?  if so, then don't bother.
    if (this.isActionsVisible) {
      return;
    }

    // have we already updated the renderRoot styles?  if so, then we are done.
    if (this.scrollTopSaved == 0) {
      return;
    }

    // if media browser list has not completely updated yet then we can't do anything.
    if (!this.hasUpdated) {
      return;
    }

    // has media browser list shadowRoot been rendered?  if not, then we can't do anything yet.
    const elmMediaList = this.shadowRoot?.querySelector(".media-browser-list") as LitElement;
    if (!elmMediaList) {
      return;
    }

    // at this point, elmMediaList should one of the following elements since they both
    // utilize the "media-browser-list" class.  Which one is controlled by user configuration
    // settings "xItemsPerRow" parameter (1=list format, 2+=icons format):
    // - "<stpc-media-browser-icons>" element
    // - "<stpc-media-browser-list>" element 

    // if shadowRoot has not updated yet then we can't do anything.
    if (!elmMediaList.shadowRoot) {
      return;
    }

    // if <stpc-media-browser-icons> has not completely updated yet then we can't do anything.
    if (!elmMediaList?.updateComplete) {
      return;
    }

    // set the vertical scroll position.
    this.mediaBrowserContentElement.scrollTop = this.scrollTopSaved || 0;

    // set a timeout to re-apply media list items scroll position, as some of the shadowRoot
    // elements may not have completed updating when the re-render occured.
    // we will also indicate that the scroll position has been updated, so we don't do it again.
    setTimeout(() => {
      this.setScrollPosition();
      this.scrollTopSaved = 0;
    }, 50);

  }


  /**
   * Updates the mediaList display.
   * 
   * @param player MediaPlayer object that will process the request.
   * 
   * @returns False if the media list should not be updated; otherwise, True to update the media list.
   */
  protected updateMediaList(player: MediaPlayer): boolean {

    // check if update is already in progress.
    if (!this.isUpdateInProgress) {
      this.isUpdateInProgress = true;
    } else {
      this.alertErrorSet(ERROR_REFRESH_IN_PROGRESS);
      return false;
    }

    // if player reference not set then we are done.
    if (!player) {
      this.isUpdateInProgress = false;
      this.alertErrorSet("Player reference not set in updateMediaList");
      return false;
    }

    // hide actions section (in case it is displayed).
    this.isActionsVisible = false;

    // reset scroll top position, as we are generating a new list.
    this.mediaBrowserContentElement.scrollTop = 0;
    this.scrollTopSaved = 0;

    // prepare to update the media list.
    // only get the `mediaListLastUpdatedOn` from cache for now, as we don't know if we are
    // refreshing the list or if we are using the cached list (if one exists).
    this.mediaListLastUpdatedOn = storageService.getStorageValue(this.cacheKeyBase + this.mediaType + CACHE_KEY_MEDIA_LIST_LAST_UPDATED, 0);

    // no need to refresh the media list if card is being edited and a cached media list was found.
    if ((this.isCardInEditPreview) && (this.mediaListLastUpdatedOn != 0)) {
      this.isUpdateInProgress = false;
      return false;
    }

    // clear alerts.
    this.alertClear();

    if (debuglog.enabled) {
      debuglog("%cupdateMediaList - updating %s medialist",
        "color: yellow;",
        JSON.stringify(this.mediaType),
      );
    }

    // indicate caller can refresh it's media list.
    return true;
  }


  /**
   * Should be called if the media list was updated successfully.
   * 
   * @param updateCache True (default) to cache media list parameters and results; otherwise, False not to update the cache.
   */
  protected updatedMediaListOk(updateCache: boolean = true): void { 

    // clear certain error messsages if they are temporary.
    if (this.alertError == ERROR_REFRESH_IN_PROGRESS) {
      this.alertErrorClear();
    }

    // if no items then update status.
    if ((this.mediaList) && (this.mediaList.length == 0)) {
      this.alertInfo = "No items found";
    }

    // cache media list parameters and results.
    if (updateCache) {
      this.storageValuesSave();
    }

    // if editing the card, then indicate the media list has been loaded.
    // we will also truncate the list of items if neccessary, to keep the ui
    // responsive while editing the card.
    if (this.isCardInEditPreview) {
      const infoMsg = truncateMediaList(this.mediaList, this.EDITOR_LIMIT_TOTAL_MAX);
      if (!(this.mediaType in Store.hasCardEditLoadedMediaList)) {
        this.alertInfo = infoMsg;
      } else {
      }
      Store.hasCardEditLoadedMediaList[this.mediaType] = true;
    }

  }


  /**
   * Should be called if an error occured while trying to update a media list.
   */
  protected updatedMediaListError(
    alertErrorMessage: string | null = null,
  ): void {

    // clear informational alerts.
    this.alertInfoClear();

    if (debuglog.enabled) {
      debuglog("%cupdatedMediaListError - error updating %s mediaList:\n %s",
        "color:red",
        JSON.stringify(this.mediaType),
        JSON.stringify(alertErrorMessage),
      );
    }

    // set alert status text.
    this.alertErrorSet(alertErrorMessage || "Unknown Error");

  }

}