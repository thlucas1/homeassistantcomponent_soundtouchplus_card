// lovelace card imports.
import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { styleMap } from 'lit-html/directives/style-map.js';
import { property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { when } from 'lit/directives/when.js';

// our imports.
import { Store } from './model/store';
import { CardConfig } from './types/cardconfig'
import { CustomImageUrls } from './types/customimageurls'
import { ConfigArea } from './types/configarea';
import { Section } from './types/section'
import './components/footer';
import './editor/editor';
import { PROGRESS_DONE, PROGRESS_STARTED, SECTION_SELECTED } from './constants';
import { formatTitleInfo, removeSpecialChars } from './utils/media-browser-utils';
import {
  getConfigAreaForSection,
  getSectionForConfigArea,
  isCardInEditPreview,
  isCardInDashboardEditor,
  isNumber,
} from './utils/utils';


const {
  PANDORA_STATIONS,
  PLAYER,
  PRESETS,
  RECENTS,
  SOURCES,
  USERPRESETS
} = Section;

const HEADER_HEIGHT = 2;
const FOOTER_HEIGHT = 4;
const CARD_DEFAULT_HEIGHT = '35.15rem';
const CARD_DEFAULT_WIDTH = '35.15rem';
const CARD_EDIT_PREVIEW_HEIGHT = '42rem';
const CARD_EDIT_PREVIEW_WIDTH = '100%';

const EDIT_TAB_HEIGHT = '48px';
const EDIT_BOTTOM_TOOLBAR_HEIGHT = '59px';

// Good source of help documentation on HA custom cards:
// https://gist.github.com/thomasloven/1de8c62d691e754f95b023105fe4b74b

export class Card extends LitElement {

  /** 
   * Home Assistant will update the hass property of the config element on state changes, and 
   * the lovelace config element, which contains information about the dashboard configuration.
   * 
   * Whenever anything updates in Home Assistant, the hass object is updated and passed out
   * to every card. If you want to react to state changes, this is where you do it. If not, 
   * you can just ommit this setter entirely.
   * Note that if you do NOT have a `set hass(hass)` in your class, you can access the hass
   * object through `this.hass`. But if you DO have it, you need to save the hass object
   * manually, like so:
   *  `this._hass = hass;`
   * */
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) config!: CardConfig;

  @state() section!: Section;
  @state() store!: Store;
  @state() showLoader!: boolean;
  @state() loaderTimestamp!: number;
  @state() cancelLoader!: boolean;
  @state() playerId!: string;

  // card editor medialist cache items.
  static mediaListCache: { [key: string]: object } = {};

  /** Indicates if createStore method is executing for the first time (true) or not (false). */
  private _isFirstTimeSetup: boolean = true;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super();

    // initialize storage.
    this.showLoader = false;
    this.cancelLoader = false;
    this.loaderTimestamp = 0;
  }


  /** 
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // just in case hass property has not been set yet.
    if (!this.hass)
      return html``;

    // note that this cannot be called from `setConfig` method, as the `hass` property
    // has not been set set.
    this.createStore();

    //console.log("render (card) - rendering card\n- this.store.section=%s\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.store.section),
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    // TODO - add a check to see if the player is of integration type 'soundtouchplus'.

    // calculate height of the card, accounting for any extra
    // titles that are shown, footer, etc.
    const sections = this.config.sections;
    const showFooter = !sections || sections.length > 1;
    const title = formatTitleInfo(this.config.title, this.config, this.store.player);

    // if no sections are configured then configure the default.
    if (!this.config.sections || this.config.sections.length === 0) {
      //console.log("render (card) - sections not configured, adding PLAYER selection")
      this.config.sections = [Section.PLAYER];
    }

    // render html for the card.
    return html`
      <ha-card class="stpc-card" style=${this.styleCard()}>
        <div class="stpc-loader" ?hidden=${!this.showLoader}>
          <ha-circular-progress indeterminate></ha-circular-progress>
        </div>
        ${title ? html`<div class="stpc-card-header">${title}</div>` : html``}
        <div class="stpc-card-content-section">
          ${
              this.playerId
              ? choose(this.section, [
                [PANDORA_STATIONS, () => html` <stpc-pandora-browser .store=${this.store} @item-selected=${this.onMediaListItemSelected}></stp-pandora-browser>`],
                [PLAYER, () => html` <stpc-player .store=${this.store}></stpc-player>`],
                [PRESETS, () => html` <stpc-preset-browser .store=${this.store} @item-selected=${this.onMediaListItemSelected}></stp-presets-browser>`],
                [RECENTS, () => html` <stpc-recent-browser .store=${this.store} @item-selected=${this.onMediaListItemSelected}></stp-recents-browser>`],
                [SOURCES, () => html` <stpc-source-browser .store=${this.store} @item-selected=${this.onMediaListItemSelected}></stp-source-browser>`],
                [USERPRESETS, () => html` <stpc-userpreset-browser .store=${this.store} @item-selected=${this.onMediaListItemSelected}></stp-userpresets-browser>`],
              ])
              : html`<div class="stpc-not-configured">Player not configured</div>`
          }
        </div>
        ${when(showFooter, () =>
          html`<stpc-footer
              class="stpc-card-footer"
              .config=${this.config}
              .section=${this.section}
              @show-section=${this.OnShowSection}
            >
            </stpc-footer>`,
        )}
      </ha-card>
    `;
  }


  /**
   * Style definitions used by this card.
   */
  static get styles() {
    return css`
      :host {
        display: inline-block;
        width: 100% !important;
        height: 100% !important;
      }

      * { 
        margin: 0; 
      }

      html,
      body {
        height: 100%;
        margin: 0;
      }

      soundtouchplus-card {
        display: block;
        height: 100% !important;
        width: 100% !important;
      }

      hui-card-preview {
        min-height: 10rem;
        height: 40rem;
        min-width: 10rem;
        width: 40rem;
      }

      .stpc-card {
        --stpc-card-header-height: ${HEADER_HEIGHT}rem;
        --stpc-card-footer-height: ${FOOTER_HEIGHT}rem;
        --stpc-card-edit-tab-height: 0px;
        --stpc-card-edit-bottom-toolbar-height: 0px;
        box-sizing: border-box;
        color: var(--secondary-text-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 20rem;
        height: calc(100vh - var(--stpc-card-footer-height) - var(--stpc-card-edit-tab-height) - var(--stpc-card-edit-bottom-toolbar-height));
        min-width: 20rem;
        width: calc(100vw - var(--mdc-drawer-width));
      }

      .stpc-card-header {
        margin: 0.2rem;
        display: flex;
        align-self: flex-start;
        align-items: center;
        justify-content: space-around;
        width: 100%;
        font-weight: bold;
        font-size: 1.2rem;
        color: var(--secondary-text-color);
      }

      .stpc-card-content-section {
        margin: 0.0rem;
        flex-grow: 1;
        flex-shrink: 0;
        height: 1vh;
        overflow: hidden;
      }

      .stpc-card-footer {
        margin: 0.2rem;
        display: flex;
        align-self: flex-start;
        align-items: center;
        justify-content: space-around;
        width: 100%;
        --mdc-icon-size: 1.75rem;
        --mdc-icon-button-size: 2.5rem;
        --mdc-ripple-top: 0px;
        --mdc-ripple-left: 0px;
        --mdc-ripple-fg-size: 10px;
      }

      .stpc-loader {
        position: absolute;
        z-index: 1000;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        --mdc-theme-primary: var(--dark-primary-color);
      }

      .stpc-not-configured {
        text-align: center;
        margin-top: 50%;
      }

      ha-icon-button {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      ha-circular-progress {
        --md-sys-color-primary: var(--dark-primary-color);
      }

      /* TODO TEST - reduce margin between editor controls */
      .root > * {
        display: block;
        margin-bottom: 0px;
        border: 1px solid red !important;
      }
      /* TODO TEST - reduce margin between editor controls */
      .root > *:not([own-margin]):not(:last-child) {
        margin-bottom: 0px;
        border: 1px solid yellow !important;
      }
    `;
  }


  /**
   * Creates the common services and data areas that are used by the various card sections.
   * 
   * Note that this method cannot be called from `setConfig` method, as the `hass` property 
   * has not been set set!
  */
  private createStore() {

    // create the store.
    //console.log("createStore (card) - creating store");
    this.store = new Store(this.hass, this.config, this, this.section, this.config.entity);

    //console.log("createStore (card) - store created\n- this.store.section=%s\n- Store.selectedConfigArea=%s\n- isCardInEditPreview=%s",
    //  JSON.stringify(this.store.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //  JSON.stringify(isCardInEditPreview(this)),
    //);

    // have we set the player id yet?  if not, then make it so.
    if (this.playerId == undefined) {
      this.playerId = this.config.entity;
    }

    // is this the first time executing setConfig method?
    if (this._isFirstTimeSetup) {

      // if there are things that you only want to happen one time when the configuration
      // is initially loaded, then do them here.

      //console.log("createStore (card) - isFirstTimeSetup logic invoked");

      // set the initial section reference; if none defined, then default;
      if ((!this.config.sections) || (this.config.sections.length == 0)) {
        //console.log("createStore (card) - config change event\n- sections not configured, adding PLAYER section");
        this.config.sections = [PLAYER];
        this.section = PLAYER;
        this.store.section = this.section;
        this.requestUpdate();
      } else if (!this.section) {
        this.section = getSectionForConfigArea(Store.selectedConfigArea);
        this.store.section = this.section;
        //console.log("createStore (card) - config change event\n- section was not set, so section %s was selected based on selected ConfigArea", JSON.stringify(this.section));
        this.requestUpdate();
      }

      // indicate first time setup has completed.
      this._isFirstTimeSetup = false;
    }
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

    // TODO - while in card edit mode, may be able to prevent loaders from showing
    // by removing the PROGRESS_STARTED / PROGRESS_DONE event listeners for all card
    // instances besides the editor card.  see utils.isCardInEditPreview for code
    // that determines how to check for the card in edit mode.
    // this will remove all of the duplicate progress loading indicators when
    // data is being refreshed in the card editor.

    // add event listeners for this control.
    window.addEventListener(PROGRESS_DONE, this.OnProgressDone);
    window.addEventListener(PROGRESS_STARTED, this.OnProgressStarted);

    // only add the following events if card configuration is being edited.
    if (isCardInEditPreview(this)) {
      window.addEventListener(SECTION_SELECTED, this.OnSectionSelected);
    }

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
    window.removeEventListener(PROGRESS_DONE, this.OnProgressDone);
    window.removeEventListener(PROGRESS_STARTED, this.OnProgressStarted);

    // always remove the following events, as isCardInEditPreview() can sometimes
    // return a different value than when the event was added in connectedCallback!
    window.removeEventListener(SECTION_SELECTED, this.OnSectionSelected);

  }


  /**
   * Called when your element has rendered for the first time. Called once in the
   * lifetime of an element. Useful for one-time setup work that requires access to
   * the DOM.
   */
  protected firstUpdated(changedProperties: PropertyValues): void {

    // invoke base class method.
    super.firstUpdated(changedProperties);

    // if there are things that you only want to happen one time when the configuration
    // is initially loaded, then do them here.

    //console.log("firstUpdated (card) - first render complete\n- isCardInEditPreview=%s",
    //  JSON.stringify(isCardInEditPreview(this)),
    //);

    // at this point, the first render has occurred.
    // ensure that the specified section is configured; if not, find the first available
    // section that IS configured and display it.
    const sectionsConfigured = this.config.sections || []
    if (!sectionsConfigured.includes(this.section)) {

      //console.log("firstUpdated (card) - active section is not configured\n- active section=%s\n- configured sections:\n%s",
      //  JSON.stringify(this.section || '*undefined*'),
      //  JSON.stringify(this.config.sections),
      //);

      // find the first active section, as determined by the order listed in the footer.
      let sectionNew: Section = Section.PLAYER;
      if (sectionsConfigured.includes(Section.PLAYER)) {
        sectionNew = Section.PLAYER;
      } else if (sectionsConfigured.includes(Section.SOURCES)) {
        sectionNew = Section.SOURCES;
      } else if (sectionsConfigured.includes(Section.PRESETS)) {
        sectionNew = Section.PRESETS;
      } else if (sectionsConfigured.includes(Section.USERPRESETS)) {
        sectionNew = Section.USERPRESETS;
      } else if (sectionsConfigured.includes(Section.RECENTS)) {
        sectionNew = Section.RECENTS;
      } else if (sectionsConfigured.includes(Section.PANDORA_STATIONS)) {
        sectionNew = Section.PANDORA_STATIONS;
      }

      // set the default editor configarea value, so that if the card is edited
      // it will automatically select the configuration settings for the section.
      Store.selectedConfigArea = getConfigAreaForSection(sectionNew);

      //console.log("firstUpdated (card) - default editor configarea set: %s",
      //  JSON.stringify(Store.selectedConfigArea),
      //);

      // show the rendered section.
      this.section = sectionNew;
      this.store.section = sectionNew;
      this.requestUpdate();

    } else if (isCardInEditPreview(this)) {

      //console.log("firstUpdated (card) - in edit mode; refreshing due to card size differences for edit mode");

      // if in edit mode, then refresh display as card size is different.
      this.requestUpdate();
    }

    //console.log("firstUpdated (card) - first render complete\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section || '*undefined*'),
    //  JSON.stringify(Store.selectedConfigArea),
    //);
  }


  /**
   * Handles the `PROGRESS_DONE` event.
   * This will hide the circular progress indicator on the main card display.
   * 
   * @param args Event arguments (none passed).
  */
  protected OnProgressDone = () => {

    this.cancelLoader = true;
    const duration = Date.now() - this.loaderTimestamp;

    //console.log("OnProgressDone (card) - Hiding progress indicator\n- duration=%s\n- this.showLoader=%s\n- isCardInEditPreview=%s",
    //  JSON.stringify(duration),
    //  JSON.stringify(this.showLoader),
    //  JSON.stringify(isCardInEditPreview(this)),
    //);

    if (this.showLoader) {
      if (duration < 1000) {
        setTimeout(() => (this.showLoader = false), 1000 - duration);
      } else {
        this.showLoader = false;
        //console.log("OnProgressDone (card) - progress is hidden");
      }
    }
  }


  /**
   * Handles the `PROGRESS_STARTED` event.
   * This will show the circular progress indicator on the main card display for lengthy operations.
   * 
   * A delay of 250 milliseconds is executed before the progress indicator is shown - if the progress
   * done event is received in this delay period, then the progress indicator is not shown.  This
   * keeps the progress indicator from "flickering" for operations that are quick to respond.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
  */
  protected OnProgressStarted = (args: Event) => {

    //console.log("OnProgressStarted() - Event Args:\n%s", JSON.stringify(args,null,2));

    //console.log("OnProgressStarted (card) - this.showLoader=%s\n- this.config.sections=%s\n- args section=%s\n- this.section=%s\n- isCardInEditPreview=%s",
    //  JSON.stringify(this.showLoader),
    //  JSON.stringify(this.config.sections),
    //  JSON.stringify((args as CustomEvent).detail.section),
    //  JSON.stringify(this.section),
    //  JSON.stringify(isCardInEditPreview(this)),
    //);

    if (!this.showLoader && (!this.config.sections || (args as CustomEvent).detail.section === this.section)) {
      this.cancelLoader = false;
      //console.log("progress is about to show");

      // wait just a bit before showing the progress indicator; if the progress done event is received
      // in this delay period, then the progress indicator is not shown.
      setTimeout(() => {
        if (!this.cancelLoader) {
          this.showLoader = true;
          this.loaderTimestamp = Date.now();
          //console.log("OnProgressStarted (card) - progress is showing - loaderTimestamp=%s",
          //  JSON.stringify(this.loaderTimestamp),
          //);
        }
      }, 250);
    }
  }


  /**
   * Handles the card configuration editor `SECTION_SELECTED` event.
   * 
   * This will select a section for display / rendering.
   * This event should only be fired from the configuration editor instance.
   * 
   * @param args Event arguments that contain the section that was selected.
  */
  protected OnSectionSelected = (args: Event) => {

    const sectionToSelect = (args as CustomEvent).detail as Section;

    // is section activated?  if so, then select it.
    if (this.config.sections?.includes(sectionToSelect)) {

      //console.log("OnSectionSelected (card) - SECTION_SELECTED event\n- OLD section=%s\n- NEW section=%s\n- store.section=%s",
      //  JSON.stringify(this.section),
      //  JSON.stringify(sectionToSelect),
      //  JSON.stringify(this.store.section),
      //);

      this.section = sectionToSelect;
      this.store.section = this.section;

    } else {

      //console.log("OnSectionSelected (card) - SECTION_SELECTED event\n- Section is not active: %s",
      //  JSON.stringify(sectionToSelect)
      //);

    }
  }


  /**
   * Handles the `SHOW_SECTION` event.
   * 
   * This will change the `section` attribute value to the value supplied, which will also force
   * a refresh of the card and display the selected section.
   * 
   * @param args Event arguments that contain the section to show.
  */
  protected OnShowSection = (args: CustomEvent) => {

    const section = args.detail;
    if (!this.config.sections || this.config.sections.indexOf(section) > -1) {

      //console.log("OnShowSection (card) - SHOW_SECTION event\n- OLD section=%s\n- NEW section=%s",
      //  JSON.stringify(this.section),
      //  JSON.stringify(section)
      //);

      this.section = section;
      this.store.section = this.section;
      this.requestUpdate();

    } else {

      //console.log("OnShowSection (card) - SHOW_SECTION event\n- section is not active: %s",
      //  JSON.stringify(section)
      //);

    }
  }


  /**
    * Handles the Media List `item-selected` event. (INACTIVE)
    * 
    * This will change the current section selection to the PLAYER section.
    * This will be useful if we ever implement a media player, so that the player is shown
    * immediately after a media list item is selected for play.
    * 
    * @param args Event arguments (none passed).
    */
  protected onMediaListItemSelected = () => {

    // if player section is configured, then show it (after a slight delay).
    if (this.config.sections?.includes(PLAYER)) {
    //  setTimeout(() => (this.section = PLAYER), 1000);
    }
  }


  /**
   * Home Assistant will call setConfig(config) when the configuration changes.  This
   * is most likely to occur when changing the configuration via the UI editor, but
   * can also occur if YAML changes are made (for cards without UI config editor).
   * 
   * If you throw an exception in this method (e.g. invalid configuration, etc), then
   * Home Assistant will render an error card to notify the user.
   * 
   * The config argument object contains the configuration specified by the user for
   * the card.  It will minimally contain:
   *   `config.type = "custom:my-custom-card"`
   * 
   * The `setConfig` method MUST be defined, and is in fact the only function that must be.
   * It doesn't need to actually DO anything, though.
   * 
   * Note that setConfig will ALWAYS be called at the start of the lifetime of the card
   * BEFORE the `hass` object is first provided.  It MAY be called several times during 
   * the lifetime of the card, e.g. if the configuration of the card is changed.
   * 
   * We use it here to update the internal config property, as well as perform some
   * basic validation and initialization of the config.
   * 
   * @param config Contains the configuration specified by the user for the card.
   */
  public setConfig(config: CardConfig): void {

    //console.log("setConfig (card) - method start");
    //console.log("setConfig (card) - configuration change\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    // copy the passed configuration object to create a new instance.
    const newConfig: CardConfig = JSON.parse(JSON.stringify(config));

    // if entity value not set then render an error card.
    if (!newConfig.entity)
      throw new Error("SoundTouchPlus media player entity id not configured");

    // remove any configuration properties that do not have a value set.
    for (const [key, value] of Object.entries(newConfig)) {
      if (Array.isArray(value) && value.length === 0) {
        //console.log("card.setConfig()\n Removing empty value config key '%s'", key)
        delete newConfig[key];
      }
    }

    // default configration values if not set.
    newConfig.pandoraBrowserItemsPerRow = newConfig.pandoraBrowserItemsPerRow || 9;
    newConfig.pandoraBrowserItemsHideTitle = newConfig.pandoraBrowserItemsHideTitle || false;
    newConfig.playerHeaderHide = newConfig.playerHeaderHide || false;
    newConfig.playerHeaderHideProgressBar = newConfig.playerHeaderHideProgressBar || false;
    newConfig.playerControlsHidePlayPause = newConfig.playerControlsHidePlayPause || false;
    newConfig.playerControlsHideRepeat = newConfig.playerControlsHideRepeat || false;
    newConfig.playerControlsHideShuffle = newConfig.playerControlsHideShuffle || false;
    newConfig.playerControlsHideTrackNext = newConfig.playerControlsHideTrackNext || false;
    newConfig.playerControlsHideTrackPrev = newConfig.playerControlsHideTrackPrev || false;
    newConfig.presetBrowserItemsPerRow = newConfig.presetBrowserItemsPerRow || 3;
    newConfig.presetBrowserItemsHideSource = newConfig.presetBrowserItemsHideSource || false;
    newConfig.presetBrowserItemsHideTitle = newConfig.presetBrowserItemsHideTitle || false;
    newConfig.recentBrowserItemsPerRow = newConfig.recentBrowserItemsPerRow || 10;
    newConfig.recentBrowserItemsHideSource = newConfig.recentBrowserItemsHideSource || false;
    newConfig.recentBrowserItemsHideTitle = newConfig.recentBrowserItemsHideTitle || false;
    newConfig.sourceBrowserItemsPerRow = newConfig.sourceBrowserItemsPerRow || 3;
    newConfig.userPresetBrowserItemsPerRow = newConfig.userPresetBrowserItemsPerRow || 3;
    newConfig.userPresetBrowserItemsHideSource = newConfig.userPresetBrowserItemsHideSource || false;
    newConfig.userPresetBrowserItemsHideTitle = newConfig.userPresetBrowserItemsHideTitle || false;

    // if custom imageUrl's are supplied, then remove special characters from each title
    // to speed up comparison when imageUrl's are loaded later on.  we will also
    // replace any spaces in the imageUrl with "%20" to make it url friendly.
    const customImageUrlsTemp = <CustomImageUrls>{};
    for (const itemTitle in (newConfig.customImageUrls)) {
      const title = removeSpecialChars(itemTitle);
      let imageUrl = newConfig.customImageUrls[itemTitle];
      imageUrl = imageUrl?.replace(' ', '%20');
      customImageUrlsTemp[title] = imageUrl;
    }
    newConfig.customImageUrls = customImageUrlsTemp;

    // ensure at least one section is selected; default to PLAYER if none selected.
    if ((newConfig.sections || []).length == 0) {
      //console.log("setConfig (card) - config change event\n- no sections configured, adding PLAYER section");
      newConfig.sections = [PLAYER];
    }

    // store configuration so other card sections can access them.
    this.config = newConfig;

    //console.log("setConfig (card) - configuration changes applied\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    //console.log("setConfig (card) - updated configuration:\n%s",
    //  JSON.stringify(this.config,null,2),
    //);
  }


  /**
   * Returns the size of the card as a number or a promise that will resolve to a number.
   * A height of 1 is equivalent to 50 pixels.
   * This will help Home Assistant distribute the cards evenly over the columns.
   * A card size of 1 will be assumed if the method is not defined.
  */
  getCardSize() {
    return 3;
  }


  /**
   * Returns a custom element for editing the user configuration. 
   * 
   * Home Assistant will display this element in the card editor in the dashboard, along with 
   * the rendered card (to the right) of the editor.
  */
  public static getConfigElement() {

    // initialize what configarea to display on entry - always GENERAL, since this is a static method.
    Store.selectedConfigArea = ConfigArea.GENERAL;

    // clear medialist cache items.
    Card.mediaListCache = {};

    // get the card configuration editor, and return for display.
    return document.createElement('stpc-editor');
  }


  /**
   * Returns a default card configuration (without the type: parameter) in json form 
   * for use by the card type picker in the dashboard.
   * 
   * Use this method to generate the initial configuration; assign defaults, omit 
   * parameters that are optional, etc.
   */
  public static getStubConfig(): Record<string, unknown> {

    return {
      sections: [Section.PRESETS, Section.RECENTS],
      entity: "",
      playerHeaderTitle: '{player.source_noaccount}',
      playerHeaderArtistTrack: '{player.media_artist} - {player.media_title}',
      playerHeaderAlbum: '{player.media_album_name}',
      playerHeaderNoMediaPlayingText: '"{player.name}" state is "{player.state}"',
      sourceBrowserTitle: '"{player.name}" Sources ({medialist.itemcount} items)',
      sourceBrowserSubTitle: 'click an item to select the source',
      sourceBrowserItemsPerRow: 1,
      presetBrowserTitle: '"{player.name}" Device Presets',
      presetBrowserSubTitle: "last updated on {player.soundtouchplus_presets_lastupdated} ({medialist.itemcount} items)",
      presetBrowserItemsPerRow: 3,
      presetBrowserItemsHideTitle: false,
      presetBrowserItemsHideSource: false,
      recentBrowserTitle: '"{player.name}" Recently Played',
      recentBrowserSubTitle: "last updated on {player.soundtouchplus_recents_cache_lastupdated} ({medialist.itemcount} items)",
      recentBrowserItemsPerRow: 4,
      recentBrowserItemsHideTitle: false,
      recentBrowserItemsHideSource: false,
      pandoraBrowserTitle: '"{player.name}" My Pandora Stations',
      pandoraBrowserSubTitle: "refreshed on {medialist.lastupdatedon} ({medialist.itemcount} items)",
      pandoraBrowserItemsPerRow: 4,
      pandoraBrowserItemsHideTitle: false,
      userPresetBrowserTitle: 'User Presets',
      userPresetBrowserSubTitle: "refreshed on {medialist.lastupdatedon} ({medialist.itemcount} items)",
      userPresetBrowserItemsPerRow: 4,
      userPresetBrowserItemsHideTitle: false,
      userPresetBrowserItemsHideSource: false,
      customImageUrls: {
        "default": "/local/images/soundtouchplus_card_customimages/default.png",
        "empty preset": "/local/images/soundtouchplus_card_customimages/empty_preset.png",
        "Daily Mix 1": "https://brands.home-assistant.io/spotifyplus/icon.png",
      }
    }
  }


  /**
   * Style the <ha-card> element.
   * 
   * @param height The computed height of the entire card (title, section, footer).
  */
  styleCard() {

    //console.log("card.styleCard() - configuration values:\nthis.config.width=%s\nthis.config.height=%s", this.config.width, this.config.height);

    let cardWidth: string | undefined = undefined;
    let cardHeight: string | undefined = undefined;
    let editTabHeight = '0px';
    let editBottomToolbarHeight = '0px';

    //console.log("styleCard (card) - styling card\n- isCardInEditPreview=%s\n- isCardInDashboardEditor=%s",
    //  JSON.stringify(isCardInEditPreview(this)),
    //  JSON.stringify(isCardInDashboardEditor()),
    //);

    // are we previewing the card in the card editor?
    // if so, then we will ignore the configuration dimensions and use constants.
    if (isCardInEditPreview(this)) {
      //console.log("styleCard (card) - card is in edit preview");
      cardHeight = CARD_EDIT_PREVIEW_HEIGHT;
      cardWidth = CARD_EDIT_PREVIEW_WIDTH;
      return styleMap({
        '--stpc-card-edit-tab-height': `${editTabHeight}`,
        '--stpc-card-edit-bottom-toolbar-height': `${editBottomToolbarHeight}`,
        height: `${cardHeight ? cardHeight : undefined}`,
        width: `${cardWidth ? cardWidth : undefined}`,
      });
    }

    // set card editor options.
    // we have to account for various editor toolbars in the height calculations when using 'fill' mode.
    // we do not have to worry about width calculations, as the width is the same with or without edit mode.
    if (isCardInDashboardEditor()) {
      //console.log("styleCard (card) - width - dashboard is in edit mode");
      editTabHeight = EDIT_TAB_HEIGHT;
      editBottomToolbarHeight = EDIT_BOTTOM_TOOLBAR_HEIGHT;
    }

    // set card width based on configuration.
    // - if 'fill', then use 100% of the horizontal space.
    // - if number value specified, then use as width (in rem units).
    // - if no value specified, then use default.
    if (this.config.width == 'fill') {
      cardWidth = '100%';
    } else if (isNumber(String(this.config.width))) {
      cardWidth = String(this.config.width) + 'rem';
    } else {
      cardWidth = CARD_DEFAULT_WIDTH;
    }

    // set card height based on configuration.
    // - if 'fill', then use 100% of the vertical space.
    // - if number value specified, then use as height (in rem units).
    // - if no value specified, then use default.
    if (this.config.height == 'fill') {
      cardHeight = 'calc(100vh - var(--stpc-card-footer-height) - var(--stpc-card-edit-tab-height) - var(--stpc-card-edit-bottom-toolbar-height))';
    } else if (isNumber(String(this.config.height))) {
      cardHeight = String(this.config.height) + 'rem';
    } else {
      cardHeight = CARD_DEFAULT_HEIGHT;
    }

    //console.log("styleCard (card) - calculated dimensions:\ncardWidth=%s\ncardHeight=%s\neditTabHeight=%s\neditBottomToolbarHeight=%s",
    //  cardWidth,
    //  cardHeight,
    //  editTabHeight,
    //  editBottomToolbarHeight,
    //);

    return styleMap({
      '--stpc-card-edit-tab-height': `${editTabHeight}`,
      '--stpc-card-edit-bottom-toolbar-height': `${editBottomToolbarHeight}`,
      height: `${cardHeight ? cardHeight : undefined}`,
      width: `${cardWidth ? cardWidth : undefined}`,
    });
  }
}
