// lovelace card imports.
import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { styleMap } from 'lit-html/directives/style-map.js';
import { customElement, property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { when } from 'lit/directives/when.js';

// our imports - card sections and editor.
import './sections/pandora-browser';
import './sections/player';
import './sections/preset-browser';
import './sections/recent-browser';
import './sections/source-browser';
import './sections/userpreset-browser';
import './components/ha-player';
import './components/footer';
import './editor/editor';

// our imports.
import { EDITOR_CONFIG_AREA_SELECTED, EditorConfigAreaSelectedEventArgs } from './events/editor-config-area-selected';
import { PROGRESS_STARTED, ProgressStartedEventArgs } from './events/progress-started';
import { PROGRESS_ENDED } from './events/progress-ended';
import { Store } from './model/store';
import { CardConfig } from './types/card-config';
import { CustomImageUrls } from './types/custom-image-urls-renamed';
import { ConfigArea } from './types/config-area';
import { Section } from './types/section';
import { formatTitleInfo, removeSpecialChars } from './utils/media-browser-utils';
import { BRAND_LOGO_IMAGE_BASE64, BRAND_LOGO_IMAGE_SIZE } from './constants';
import {
  getConfigAreaForSection,
  getSectionForConfigArea,
  isCardInEditPreview,
  isCardInDashboardEditor,
  isCardInPickerPreview,
  isNumber,
} from './utils/utils';


const HEADER_HEIGHT = 2;
const FOOTER_HEIGHT = 4;
const CARD_DEFAULT_HEIGHT = '35.15rem';
const CARD_DEFAULT_WIDTH = '35.15rem';
const CARD_EDIT_PREVIEW_HEIGHT = '42rem';
const CARD_EDIT_PREVIEW_WIDTH = '100%';
const CARD_PICK_PREVIEW_HEIGHT = '100%';
const CARD_PICK_PREVIEW_WIDTH = '100%';

const EDIT_TAB_HEIGHT = '48px';
const EDIT_BOTTOM_TOOLBAR_HEIGHT = '59px';

// Good source of help documentation on HA custom cards:
// https://gist.github.com/thomasloven/1de8c62d691e754f95b023105fe4b74b


@customElement("soundtouchplus-card")
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
  @property({ attribute: false }) footerBackgroundColor?: string;

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

    // if no sections are configured then configure the default.
    if (!this.config.sections || this.config.sections.length === 0) {
      //console.log("render (card) - sections not configured, adding PLAYER to config.sections")
      this.config.sections = [Section.PLAYER];
      Store.selectedConfigArea = ConfigArea.GENERAL;
    }

    //console.log("render (card) - rendering card\n- this.store.section=%s\n- this.section=%s\n- Store.selectedConfigArea=%s\n- playerId=%s\n- config.sections=%s",
    //  JSON.stringify(this.store.section),
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //  JSON.stringify(this.playerId),
    //  JSON.stringify(this.config.sections),
    //);

    // calculate height of the card, accounting for any extra
    // titles that are shown, footer, etc.
    const sections = this.config.sections;
    const showFooter = !sections || sections.length > 1;
    const title = formatTitleInfo(this.config.title, this.config, this.store.player);

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
                [Section.PANDORA_STATIONS, () => html` <stpc-pandora-browser .store=${this.store} @item-selected=${this.OnMediaListItemSelected}></stp-pandora-browser>`],
                [Section.PLAYER, () => html` <stpc-player .store=${this.store}></stpc-player>`],
                [Section.PRESETS, () => html` <stpc-preset-browser .store=${this.store} @item-selected=${this.OnMediaListItemSelected}></stp-presets-browser>`],
                [Section.RECENTS, () => html` <stpc-recent-browser .store=${this.store} @item-selected=${this.OnMediaListItemSelected}></stp-recents-browser>`],
                [Section.SOURCES, () => html` <stpc-source-browser .store=${this.store} @item-selected=${this.OnMediaListItemSelected}></stp-source-browser>`],
                [Section.USERPRESETS, () => html` <stpc-userpreset-browser .store=${this.store} @item-selected=${this.OnMediaListItemSelected}></stp-userpresets-browser>`],
                [Section.UNDEFINED, () => html`<div class="stpc-not-configured">SpotifyPlus card configuration error.<br/>Please configure section(s) to display.</div>`],
              ])
              : html`<div class="stpc-initial-config">Welcome to the SoundTouchPlus media player card.<br/>Start by configuring a media player entity.</div>`
          //    : choose(this.section, [
          //      [Section.INITIAL_CONFIG, () => html`<div class="stpc-initial-config">Welcome to the SoundTouchPlus media player card.<br/>Please start by configuring the card.</div>`],
          //      [Section.UNDEFINED, () => html`<div class="stpc-not-configured">SoundTouchPlus card configuration error.<br/>Please check the card configuration.</div>`],
          //    ]) 
          }
        </div>
        ${when(showFooter, () =>
          html`<div class="stpc-card-footer-container" style=${this.styleCardFooter()}>
            <stpc-footer
              class="stpc-card-footer"
              .config=${this.config}
              .section=${this.section}
              @show-section=${this.OnFooterShowSection}
            ></stpc-footer>
          </div>`
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
        display: block;
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

      .stpc-card-footer-container {
        width: 100%;
        display: flex;
        align-items: center;
        background-repeat: no-repeat;
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
        margin-top: 1rem;
      }

      .stpc-initial-config {
        text-align: center;
        margin-top: 1rem;
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
    if (!this.playerId) {
      this.playerId = this.config.entity;
    }

    // is this the first time executing?
    if ((this._isFirstTimeSetup) && (this.playerId)) {

      // if there are things that you only want to happen one time when the configuration
      // is initially loaded, then do them here.

      //console.log("createStore (card) - isFirstTimeSetup logic invoked");

      // set the initial section reference; if none defined, then default;
      if ((!this.config.sections) || (this.config.sections.length == 0)) {
        //console.log("createStore (card) - config change event\n- sections not configured, adding PLAYER to config.sections");
        this.config.sections = [Section.PLAYER];
        this.section = Section.PLAYER;
        this.store.section = this.section;
        Store.selectedConfigArea = ConfigArea.GENERAL;
        super.requestUpdate();
      } else if (!this.section) {
        this.section = getSectionForConfigArea(Store.selectedConfigArea);
        this.store.section = this.section;
        //console.log("createStore (card) - config change event\n- section was not set, so section %s was selected based on selected ConfigArea", JSON.stringify(this.section));
        super.requestUpdate();
      }

      // indicate first time setup has completed.
      this._isFirstTimeSetup = false;
    }
  }


  /**
   * Sets the section value and requests an update to show the section.
   * 
   * @param section Section to show.
  */
  public SetSection(section: Section): void {

    // is the session configured for display?
    if (!this.config.sections || this.config.sections.indexOf(section) > -1) {

      //console.log("SetSection (card) - set section reference and display the section\n- OLD section=%s\n- NEW section=%s",
      //  JSON.stringify(this.section),
      //  JSON.stringify(section)
      //);

      this.section = section;
      this.store.section = this.section;
      super.requestUpdate();

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
  public connectedCallback() {

    // invoke base class method.
    super.connectedCallback();

    // add event listeners for this control.
    this.addEventListener(PROGRESS_ENDED, this.OnProgressEndedEventHandler);
    this.addEventListener(PROGRESS_STARTED, this.OnProgressStartedEventHandler);

    // only add the following events if card configuration is being edited.
    if (isCardInEditPreview(this)) {

      document.addEventListener(EDITOR_CONFIG_AREA_SELECTED, this.OnEditorConfigAreaSelectedEventHandler);

      //console.log("%c connectedCallback (card) - added event listener: %s",
      //  "color: red;",
      //  JSON.stringify(EDITOR_CONFIG_AREA_SELECTED),
      //);

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
  public disconnectedCallback() {

    // remove event listeners for this control.
    this.removeEventListener(PROGRESS_ENDED, this.OnProgressEndedEventHandler);
    this.removeEventListener(PROGRESS_STARTED, this.OnProgressStartedEventHandler);

    // the following event is only added when the card configuration editor is created.
    // always remove the following events, as isCardInEditPreview() can sometimes
    // return a different value than when the event was added in connectedCallback!
    document.removeEventListener(EDITOR_CONFIG_AREA_SELECTED, this.OnEditorConfigAreaSelectedEventHandler);

    //console.log("%c disconnectedCallback (card) - removed event listener: %s",
    //  "color: blue;",
    //  JSON.stringify(EDITOR_CONFIG_AREA_SELECTED),
    //);

    // invoke base class method.
    super.disconnectedCallback();

  }


  /**
   * Called when the element has rendered for the first time. Called once in the
   * lifetime of an element. Useful for one-time setup work that requires access to
   * the DOM.
   */
  protected firstUpdated(changedProperties: PropertyValues): void {

    // invoke base class method.
    super.firstUpdated(changedProperties);

    //console.log("firstUpdated (card) - 1st render complete - changedProperties keys:\n- %s",
    //  JSON.stringify(Array.from(changedProperties.keys())),
    //);

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
      super.requestUpdate();

    } else if (isCardInEditPreview(this)) {

      //console.log("firstUpdated (card) - in edit mode; refreshing due to card size differences for edit mode");

      // if in edit mode, then refresh display as card size is different.
      super.requestUpdate();
    }

    //console.log("firstUpdated (card) - first render complete\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section || '*undefined*'),
    //  JSON.stringify(Store.selectedConfigArea),
    //);
  }


  /**
   * Handles the `PROGRESS_ENDED` event.
   * This will hide the circular progress indicator on the main card display.
   * 
   * This event has no arguments.
  */
  protected OnProgressEndedEventHandler = () => {

    this.cancelLoader = true;
    const duration = Date.now() - this.loaderTimestamp;

    //console.log("OnProgressEndedEventHandler (card) - Hiding progress indicator\n- duration=%s\n- this.showLoader=%s\n- isCardInEditPreview=%s",
    //  JSON.stringify(duration),
    //  JSON.stringify(this.showLoader),
    //  JSON.stringify(isCardInEditPreview(this)),
    //);

    if (this.showLoader) {
      if (duration < 1000) {
        setTimeout(() => (this.showLoader = false), 1000 - duration);
      } else {
        this.showLoader = false;
        //console.log("OnProgressEndedEventHandler (card) - progress is hidden");
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
   * @param ev Event definition and arguments.
  */
  protected OnProgressStartedEventHandler = (ev: Event) => {

    // map event arguments.
    const evArgs = (ev as CustomEvent).detail as ProgressStartedEventArgs;

    //console.log("OnProgressStartedEventHandler() - Event Args:\n%s",
    //  JSON.stringify(evArgs, null, 2)
    //);

    //console.log("OnProgressStartedEventHandler (card) - this.showLoader=%s\n- this.config.sections=%s\n- args section=%s\n- this.section=%s\n- isCardInEditPreview=%s",
    //  JSON.stringify(this.showLoader),
    //  JSON.stringify(this.config.sections),
    //  JSON.stringify(evArgs.section),
    //  JSON.stringify(this.section),
    //  JSON.stringify(isCardInEditPreview(this)),
    //);

    if (!this.showLoader && (!this.config.sections || evArgs.section === this.section)) {

      this.cancelLoader = false;
      //console.log("progress is about to show");

      // wait just a bit before showing the progress indicator; if the progress done event is received
      // in this delay period, then the progress indicator is not shown.
      setTimeout(() => {
        if (!this.cancelLoader) {
          this.showLoader = true;
          this.loaderTimestamp = Date.now();
          //console.log("OnProgressStartedEventHandler (card) - progress is showing - loaderTimestamp=%s",
          //  JSON.stringify(this.loaderTimestamp),
          //);
        } else {
          //console.log("OnProgressStartedEventHandler (card) - progress was cancelled before it had to be shown");
        }
      }, 250);

    }
  }


  /**
   * Handles the card configuration editor `EDITOR_CONFIG_AREA_SELECTED` event.
   * 
   * This will select a section for display / rendering.
   * This event should only be fired from the configuration editor instance.
   * 
   * @param ev Event definition and arguments.
  */
  protected OnEditorConfigAreaSelectedEventHandler = (ev: Event) => {

    //console.log("OnEditorConfigAreaSelectedEventHandler (card) - event data:\n%s",
    //  JSON.stringify(ev),
    //);

    // map event arguments.
    const evArgs = (ev as CustomEvent).detail as EditorConfigAreaSelectedEventArgs;

    // is section activated?  if so, then select it.
    if (this.config.sections?.includes(evArgs.section)) {

      //console.log("OnEditorConfigAreaSelectedEventHandler (card) - editor configarea selected\n- OLD section=%s\n- NEW section=%s\n- store.section=%s",
      //  JSON.stringify(this.section),
      //  JSON.stringify(evArgs.section),
      //  JSON.stringify(this.store.section),
      //);

      this.section = evArgs.section;
      this.store.section = this.section;

    } else {

      //console.log("OnEditorConfigAreaSelectedEventHandler (card) - Section is not active: %s",
      //  JSON.stringify(evArgs.section)
      //);

    }
  }


  /**
   * Handles the footer `show-section` event.
   * 
   * This will change the `section` attribute value to the value supplied, which will also force
   * a refresh of the card and display the selected section.
   * 
   * @param args Event arguments that contain the section to show.
  */
  protected OnFooterShowSection = (args: CustomEvent) => {

    const section = args.detail;
    if (!this.config.sections || this.config.sections.indexOf(section) > -1) {

      //console.log("OnFooterShowSection (card) - footer show-section event\n- OLD section=%s\n- NEW section=%s",
      //  JSON.stringify(this.section),
      //  JSON.stringify(section)
      //);

      this.section = section;
      this.store.section = this.section;
      super.requestUpdate();

    } else {

      //console.log("OnFooterShowSection (card) - footer show-section  event\n- section is not active: %s",
      //  JSON.stringify(section)
      //);

    }
  }


  /**
    * Handles the Media List `item-selected` event.
    * 
    * @param args Event arguments (none passed).
    */
  protected OnMediaListItemSelected = () => {

    //console.log("OnMediaListItemSelected (card) - media list item selected; showing player\n- section=%s",
    //  JSON.stringify(this.section)
    //);

    // don't need to do anything here, as the section will show the player.
    // left this code here though, in case we want to do something else after
    // an item is selected.

    // example: show the card Player section (after a slight delay).
    //setTimeout(() => (this.SetSection(Section.PLAYER)), 1500);

  }


  /**
   * Home Assistant will call setConfig(config) when the configuration changes.  This
   * is most likely to occur when changing the configuration via the UI editor, but
   * can also occur if YAML changes are made (for cards without UI config editor).
   * 
   * If you throw an exception in this method (e.g. invalid configuration, etc), then
   * Home Assistant will render an error card to notify the user.  Note that by doing
   * so will also disable the Card Editor UI, and the card must be configured manually!
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

    // remove any configuration properties that do not have a value set.
    for (const [key, value] of Object.entries(newConfig)) {
      if (Array.isArray(value) && value.length === 0) {
        //console.log("setConfig (card) - Removing empty config value\n- config key = '%s'", key)
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

    // if no sections are configured then configure the default.
    if (!newConfig.sections || newConfig.sections.length === 0) {
      //console.log("setConfig (card) - sections not configured, adding PLAYER to config.sections")
      newConfig.sections = [Section.PLAYER];
      Store.selectedConfigArea = ConfigArea.GENERAL;
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
      sections: [Section.PLAYER, Section.PRESETS, Section.RECENTS, Section.SOURCES, Section.USERPRESETS],
      entity: "",

      playerHeaderTitle: '{player.source_noaccount}',
      playerHeaderArtistTrack: '{player.media_artist} - {player.media_title}',
      playerHeaderAlbum: '{player.media_album_name}',
      playerHeaderNoMediaPlayingText: '"{player.name}" state is "{player.state}"',

      sourceBrowserTitle: '"{player.name}" Sources ({medialist.itemcount} items)',
      sourceBrowserSubTitle: 'click an item to select the source',
      sourceBrowserItemsPerRow: 1,

      presetBrowserTitle: '"{player.name}" Device Presets ({medialist.itemcount} items)',
      presetBrowserSubTitle: "click a tile image to play the content",
      presetBrowserItemsPerRow: 3,
      presetBrowserItemsHideTitle: false,
      presetBrowserItemsHideSource: false,

      recentBrowserTitle: '"{player.name}" Recently Played ({medialist.itemcount} items)',
      recentBrowserSubTitle: "click a tile image to play the content",
      recentBrowserItemsPerRow: 4,
      recentBrowserItemsHideTitle: false,
      recentBrowserItemsHideSource: false,

      pandoraBrowserTitle: '"{player.name}" My Pandora Stations ({medialist.itemcount} items)',
      pandoraBrowserSubTitle: "click a tile image to play the content",
      pandoraBrowserItemsPerRow: 4,
      pandoraBrowserItemsHideTitle: false,

      userPresetBrowserTitle: 'User Presets ({medialist.itemcount} items)',
      userPresetBrowserSubTitle: "click a tile image to play the content",
      userPresetBrowserItemsPerRow: 4,
      userPresetBrowserItemsHideTitle: false,
      userPresetBrowserItemsHideSource: false,

      userPresets: [
        {
          "ContentItem": {
            "Name": "Playlist Daily Mix 1",
            "ContainerArt": "https://dailymix-images.scdn.co/v2/img/ab6761610000e5ebcd3f796bd7ea49ed7615a550/1/en/default",
            "Location": "spotify:playlist:37i9dQZF1E39vTG3GurFPW",
            "Source": "SPOTIFY",
            "SourceAccount": "YourSpotifyUserId",
            "TypeValue": "uri"
          }
        },
        {
          "ContentItem": {
            "Name": "Zach Williams Radio",
            "ContainerArt": "https://content-images.p-cdn.com/images/68/88/0d/fb/aed34095a11118d2aa7b02a2/_500W_500H.jpg",
            "Location": "126740707481236361",
            "Source": "PANDORA",
            "SourceAccount": "YourPandoraUserId"
          }
        },
        {
          "ContentItem": {
            "Name": "K-Love Radio",
            "ContainerArt": "http://cdn-profiles.tunein.com/s33828/images/logog.png?t=637986894890000000",
            "Location": "/v1/playback/station/s33828",
            "Source": "TUNEIN",
            "TypeValue": "stationurl"
          }
        }
      ],

      customImageUrls: {
        "Xdefault": "/local/images/soundtouchplus_card_customimages/default.png",
        "Xempty preset": "/local/images/soundtouchplus_card_customimages/empty_preset.png",
        "XDaily Mix 1": "https://brands.home-assistant.io/spotifyplus/icon.png",
      }
    }
  }


  /**
   * Style the <ha-card> element.
   * 
   * @param height The computed height of the entire card (title, section, footer).
  */
  private styleCard() {

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
        'background-repeat': `${!this.playerId ? 'no-repeat' : undefined}`,
        'background-position': `${!this.playerId ? 'center' : undefined}`,
        'background-image': `${!this.playerId ? 'url(' + BRAND_LOGO_IMAGE_BASE64 + ')' : undefined}`,
        'background-size': `${!this.playerId ? BRAND_LOGO_IMAGE_SIZE : undefined}`,
      });
    }

    // set card picker options.
    if (isCardInPickerPreview(this)) {
      //console.log("styleCard (card) - card is in pick preview");
      cardHeight = CARD_PICK_PREVIEW_HEIGHT;
      cardWidth = CARD_PICK_PREVIEW_WIDTH;
      return styleMap({
        '--stpc-card-edit-tab-height': `${editTabHeight}`,
        '--stpc-card-edit-bottom-toolbar-height': `${editBottomToolbarHeight}`,
        height: `${cardHeight ? cardHeight : undefined}`,
        width: `${cardWidth ? cardWidth : undefined}`,
        'background-repeat': `no-repeat`,
        'background-position': `center`,
        'background-image': `url(${BRAND_LOGO_IMAGE_BASE64})`,
        'background-size': `${BRAND_LOGO_IMAGE_SIZE}`,
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


  /**
   * Style the <spc-card-background-container> element.
   */
  private styleCardFooter() {

    //console.log("styleCardFooter (card) - styling card footer container:\n- footerBackgroundColor = %s",
    //  JSON.stringify(this.footerBackgroundColor),
    //);

    // is player selected, and a footer background color set?
    if ((this.section == Section.PLAYER) && (this.footerBackgroundColor)) {

      // yes - return vibrant background style.
      return styleMap({
        '--stpc-player-footer-bg-color': `${this.footerBackgroundColor || 'transparent'}`,
        'background-color': 'var(--stpc-player-footer-bg-color)',
        'background-image': 'linear-gradient(rgba(0, 0, 0, 1.6), rgba(0, 0, 0, 0.6))',
      });

    } else {

      // no - just return an empty style to let it default to the card background.
      return styleMap({
      });

    }
  }

}
