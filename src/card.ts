// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from './constants';
const debuglog = Debug(DEBUG_APP_NAME + ":card");

// lovelace card imports.
import { css, html, PropertyValues, TemplateResult } from 'lit';
import { styleMap, StyleInfo } from 'lit-html/directives/style-map.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { when } from 'lit/directives/when.js';
import { HomeAssistant } from './types/home-assistant-frontend/home-assistant';

// our imports - card sections and editor.
import './sections/pandora-browser';
import './sections/player';
import './sections/preset-browser';
import './sections/recent-browser';
import './sections/source-browser';
import './sections/userpreset-browser';
import './components/footer';
import './editor/editor';

// our imports.
import {
  BRAND_LOGO_IMAGE_BASE64,
  BRAND_LOGO_IMAGE_SIZE,
  FOOTER_ICON_SIZE_DEFAULT
} from './constants';
import {
  getConfigAreaForSection,
  getSectionForConfigArea,
  isCardInDashboardEditor,
  isCardInPickerPreview,
  isNumber,
  getHomeAssistantErrorMessage,
} from './utils/utils';
import { EDITOR_CONFIG_AREA_SELECTED, EditorConfigAreaSelectedEventArgs } from './events/editor-config-area-selected';
import { FILTER_SECTION_MEDIA, FilterSectionMediaEventArgs } from './events/filter-section-media';
import { PROGRESS_STARTED } from './events/progress-started';
import { PROGRESS_ENDED } from './events/progress-ended';
import { Store } from './model/store';
import { CardConfig } from './types/card-config';
import { CustomImageUrls } from './types/custom-image-urls';
import { ConfigArea } from './types/config-area';
import { Section } from './types/section';
import { FavBrowserBase } from './sections/fav-browser-base';
import { PandoraBrowser } from './sections/pandora-browser';
import { PresetBrowser } from './sections/preset-browser';
import { RecentBrowser } from './sections/recent-browser';
import { SourceBrowser } from './sections/source-browser';
import { UserPresetBrowser } from './sections/userpreset-browser';
import { formatTitleInfo, removeSpecialChars } from './utils/media-browser-utils';
import { ISoundTouchDevice } from './types/soundtouchplus/soundtouch-device';
import { MediaPlayer } from './model/media-player';
import { AlertUpdatesBase } from './sections/alert-updates-base';


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
export class Card extends AlertUpdatesBase {

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

  // public state properties.
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) config!: CardConfig;
  @property({ attribute: false }) footerBackgroundColor?: string;
  @property({ attribute: false }) public soundTouchDevice!: ISoundTouchDevice | undefined;

  // private state properties.
  @state() section!: Section;
  @state() showLoader!: boolean;
  @state() loaderTimestamp!: number;
  @state() cancelLoader!: boolean;
  @state() playerId!: string;

  // card section references.
  @query("#elmPandoraBrowserForm", false) private elmPandoraBrowserForm!: PandoraBrowser;
  @query("#elmPresetBrowserForm", false) private elmPresetBrowserForm!: PresetBrowser;
  @query("#elmRecentBrowserForm", false) private elmRecentBrowserForm!: RecentBrowser;
  @query("#elmSourceBrowserForm", false) private elmSourceBrowserForm!: SourceBrowser;
  @query("#elmUserPresetBrowserForm", false) private elmUserPresetBrowserForm!: UserPresetBrowser;

  // card editor medialist cache items.
  static mediaListCache: { [key: string]: object } = {};

  /** Indicates if createStore method is executing for the first time (true) or not (false). */
  private isFirstTimeSetup: boolean = true;

  /** Indicates if GetDeviceInfo call was made (true) or not (false). */
  private isGetDeviceInfoCalled: boolean = false;


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
        ${title ? html`<div class="stpc-card-header" style=${this.styleCardHeader()}>${title}</div>` : ""}
        ${this.alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this.alertErrorClear}>${this.alertError}</ha-alert>` : ""}
        ${this.alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this.alertInfoClear}>${this.alertInfo}</ha-alert>` : ""}
        <div class="stpc-card-content-section">
          ${this.store.player.id != ""
              ? choose(this.section, [
                [Section.PANDORA_STATIONS, () => html` <stpc-pandora-browser .store=${this.store} id="elmPandoraBrowserForm" @item-selected=${this.onMediaListItemSelected}></stp-pandora-browser>`],
                [Section.PLAYER, () => html`<stpc-player id="spcPlayer" .store=${this.store}></stpc-player>`],
                [Section.PRESETS, () => html` <stpc-preset-browser .store=${this.store} id="elmPresetBrowserForm"  @item-selected=${this.onMediaListItemSelected}></stp-presets-browser>`],
                [Section.RECENTS, () => html` <stpc-recent-browser .store=${this.store} id="elmRecentBrowserForm" @item-selected=${this.onMediaListItemSelected}></stp-recents-browser>`],
                [Section.SOURCES, () => html` <stpc-source-browser .store=${this.store} id="elmSourceBrowserForm" @item-selected=${this.onMediaListItemSelected}></stp-source-browser>`],
                [Section.USERPRESETS, () => html` <stpc-userpreset-browser .store=${this.store} id="elmUserPresetBrowserForm" @item-selected=${this.onMediaListItemSelected}></stp-userpresets-browser>`],
              ])
              : html`
                  <div class="stpc-initial-config">
                    Welcome to the SoundTouchPlus media player card.<br/>
                    Start by editing the card configuration media player "entity" value.<br/>
                    <div class="stpc-not-configured">
                      ${this.store.player.attributes.stp_config_state}
                    </div>
                  </div>`
          }
        </div>
        ${when(showFooter, () =>
          html`<div class="stpc-card-footer-container" style=${this.styleCardFooter()}>
            <stpc-footer
              class="stpc-card-footer"
              .config=${this.config}
              .section=${this.section}
              @show-section=${this.onFooterShowSection}
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

      spotifyplus-card {
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
        padding: 0rem;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 20rem;
        height: calc(100vh - var(--stpc-card-footer-height) - var(--stpc-card-edit-tab-height) - var(--stpc-card-edit-bottom-toolbar-height));
        min-width: 20rem;
        width: calc(100vw - var(--mdc-drawer-width));
        color: var(--secondary-text-color);
      }

      .stpc-card-header {
        box-sizing: border-box;
        padding: 0.2rem;
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
        color: var(--stpc-card-footer-color, inherit);
        background-color: var(--stpc-card-footer-background-color, var(--stpc-player-footer-bg-color, var(--card-background-color, transparent)));
        background-image: var(--stpc-card-footer-background-image, linear-gradient(rgba(0, 0, 0, 0.6), rgb(0, 0, 0)));
      }

      .stpc-card-footer {
        margin: 0.2rem;
        display: flex;
        align-self: flex-start;
        align-items: center;
        justify-content: space-around;
        flex-wrap: wrap;
        width: 100%;
        --mdc-icon-button-size: var(--stpc-footer-icon-button-size, 2.5rem);
        --mdc-icon-size: var(--stpc-footer-icon-size, 1.75rem);
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
        --mdc-theme-primary: var(--stpc-card-wait-progress-slider-color, var(--dark-primary-color, #2196F3));
      }

      .stpc-not-configured {
        text-align: center;
        margin: 1rem;
        color: #fa2643;
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
        --md-sys-color-primary: var(--stpc-card-wait-progress-slider-color, var(--dark-primary-color, #2196F3));
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
    this.store = new Store(this.hass, this.config, this, this.section);

    // have we set the player id yet?  if not, then make it so.
    if (!this.playerId) {
      this.playerId = this.config.entity;
    }

    // was the player resolved to an entity? if so, then load device information.
    if ((!this.soundTouchDevice) && (this.store.player) && (this.store.player.id != "")) {

      //debuglog("createStore - player was resolved to an entity\n- this.isGetDeviceInfoCalled = %s\n- stp_config_state = %s",
      //  JSON.stringify(this.isGetDeviceInfoCalled),
      //  JSON.stringify(this.store.player.attributes.stp_config_state),
      //);

      if (!this.isGetDeviceInfoCalled) {

        // we only want to get device information if there are no config errors;
        // otherwise, it's a continuous loop!
        if (this.store.player.attributes.stp_config_state || "" == "") {
          this.updateSoundTouchDevice(this.store.player);
        }
      }
    }

    // is this the first time executing?
    if ((this.isFirstTimeSetup) && (this.playerId)) {

      // if there are things that you only want to happen one time when the configuration
      // is initially loaded, then do them here.
      debuglog("createStore - isFirstTimeSetup logic invoked; creating store area");

      // set the initial section reference; if none defined, then default;
      if ((!this.config.sections) || (this.config.sections.length == 0)) {

        this.config.sections = [Section.PLAYER];
        this.section = Section.PLAYER;
        this.store.section = this.section;
        Store.selectedConfigArea = ConfigArea.GENERAL;
        super.requestUpdate();

      } else if (!this.section) {

        // section was not set; set section selected based on selected ConfigArea.
        this.section = getSectionForConfigArea(Store.selectedConfigArea);
        this.store.section = this.section;
        super.requestUpdate();

      }

      // indicate first time setup has completed.
      this.isFirstTimeSetup = false;
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

    // determine if card configuration is being edited.
    //this.isCardInEditPreview = isCardInEditPreview(this);

    // add card level event listeners.
    this.addEventListener(PROGRESS_ENDED, this.onProgressEndedEventHandler);
    this.addEventListener(PROGRESS_STARTED, this.onProgressStartedEventHandler);
    this.addEventListener(FILTER_SECTION_MEDIA, this.onFilterSectionMediaEventHandler);

    // only add the following events if card configuration is being edited.
    if (this.isCardInEditPreview) {

      // add document level event listeners.
      document.addEventListener(EDITOR_CONFIG_AREA_SELECTED, this.onEditorConfigAreaSelectedEventHandler);

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

    // remove card level event listeners.
    this.removeEventListener(PROGRESS_ENDED, this.onProgressEndedEventHandler);
    this.removeEventListener(PROGRESS_STARTED, this.onProgressStartedEventHandler);
    this.removeEventListener(FILTER_SECTION_MEDIA, this.onFilterSectionMediaEventHandler);

    // the following event is only added when the card configuration editor is created.
    // always remove the following events, as isCardInEditPreview() can sometimes
    // return a different value than when the event was added in connectedCallback!

    // remove document level event listeners.
    document.removeEventListener(EDITOR_CONFIG_AREA_SELECTED, this.onEditorConfigAreaSelectedEventHandler);

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

    if (debuglog.enabled) {
      debuglog("firstUpdated (card) - 1st render complete - changedProperties keys:\n%s",
        JSON.stringify(Array.from(changedProperties.keys())),
      );
    }

    // if there are things that you only want to happen one time when the configuration
    // is initially loaded, then do them here.

    // at this point, the first render has occurred.
    // ensure that the specified section is configured; if not, find the first available
    // section that IS configured and display it.
    const sectionsConfigured = this.config.sections || []
    if (!sectionsConfigured.includes(this.section)) {

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

      // show the rendered section.
      this.section = sectionNew;
      this.store.section = sectionNew;
      super.requestUpdate();

    } else if (this.isCardInEditPreview) {

      // if in edit mode, then refresh display as card size is different.
      super.requestUpdate();
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
  protected onEditorConfigAreaSelectedEventHandler = (ev: Event) => {

    // map event arguments.
    const evArgs = (ev as CustomEvent).detail as EditorConfigAreaSelectedEventArgs;

    // is section activated?  if so, then select it.
    if (this.config.sections?.includes(evArgs.section)) {

      this.section = evArgs.section;
      this.store.section = this.section;

    } else {

      // section is not activated.

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
  protected onFooterShowSection = (args: CustomEvent) => {

    const section = args.detail;
    if (!this.config.sections || this.config.sections.indexOf(section) > -1) {

      this.section = section;
      this.store.section = this.section;
      super.requestUpdate();

    } else {

      // specified section is not active.

    }
  }


  /**
    * Handles the Media List `item-selected` event.
    * 
    * @param args Event arguments (none passed).
    */
  protected onMediaListItemSelected = () => {

    // don't need to do anything here, as the section will show the player.
    // left this code here though, in case we want to do something else after
    // an item is selected.

    // example: show the card Player section (after a slight delay).
    //setTimeout(() => (this.SetSection(Section.PLAYER)), 1500);

  }


  /**
   * Handles the `PROGRESS_ENDED` event.
   * This will hide the circular progress indicator on the main card display.
   * 
   * This event has no arguments.
  */
  protected onProgressEndedEventHandler = () => {

    this.cancelLoader = true;
    const duration = Date.now() - this.loaderTimestamp;

    // is the progress loader icon visible?
    if (this.showLoader) {

      if (duration < 1000) {
        // progress will hide in less than 1 second.
        setTimeout(() => (this.showLoader = false), 1000 - duration);
      } else {
        this.showLoader = false;
        // progress is hidden.
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
  protected onProgressStartedEventHandler = () => {

    // is progress bar currently shown? if not, then make it so.
    if (!this.showLoader) {

      this.cancelLoader = false;

      // wait just a bit before showing the progress indicator; if the progress done event is received
      // in this delay period, then the progress indicator is not shown.
      setTimeout(() => {
        if (!this.cancelLoader) {
          this.showLoader = true;
          this.loaderTimestamp = Date.now();
          // progress is showing.
        } else {
          // progress was cancelled before it had to be shown.
        }
      }, 250);

    }
  }


  /**
   * Handles the `FILTER_SECTION_MEDIA` event.
   * This will show the specified section, and apply the specified filter criteria
   * passed in the event arguments.
   *
   * @param ev Event definition and arguments.
  */
  protected onFilterSectionMediaEventHandler = (ev: Event) => {

    // map event arguments.
    const evArgs = (ev as CustomEvent).detail as FilterSectionMediaEventArgs;

    // validate section id.
    const enumValues: string[] = Object.values(Section);
    if (!enumValues.includes(evArgs.section || "")) {
      debuglog("%conFilterSectionMediaEventHandler - Ignoring Filter request; section is not a valid Section enum value:\n%s",
        "color:red",
        JSON.stringify(evArgs, null, 2),
      );
    }

    // is section activated?  if so, then select it.
    if (this.config.sections?.includes(evArgs.section as Section)) {

      // show the search section.
      this.section = evArgs.section as Section;
      this.store.section = this.section;

      // wait just a bit before executing the search.
      setTimeout(() => {

        if (debuglog.enabled) {
          debuglog("onFilterSectionMediaEventHandler - executing filter:\n%s",
            JSON.stringify(evArgs, null, 2),
          );
        }

        // reference the section browser.
        let browserBase: FavBrowserBase;
        if (evArgs.section == Section.PANDORA_STATIONS) {
          browserBase = this.elmPandoraBrowserForm;
        } else if (evArgs.section == Section.PRESETS) {
          browserBase = this.elmPresetBrowserForm;
        } else if (evArgs.section == Section.RECENTS) {
          browserBase = this.elmRecentBrowserForm;
        } else if (evArgs.section == Section.SOURCES) {
          browserBase = this.elmSourceBrowserForm;
        } else if (evArgs.section == Section.USERPRESETS) {
          browserBase = this.elmUserPresetBrowserForm;
        } else {
          return;
        }

        // execute the filter.
        browserBase.filterSectionMedia(evArgs);

      }, 50);

    } else {

      // section is not activated; cannot search.
      debuglog("%onFilterSectionMediaEventHandler - Filter section is not enabled; ignoring filter request:\n%s",
        "color:red",
        JSON.stringify(evArgs, null, 2),
      );
    }
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

    //console.log("setConfig (card) - configuration change\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    // copy the passed configuration object to create a new instance.
    const newConfig: CardConfig = JSON.parse(JSON.stringify(config));

    // remove any configuration properties that do not have a value set.
    for (const [key, value] of Object.entries(newConfig)) {
      if (Array.isArray(value) && value.length === 0) {
        delete newConfig[key];
      }
    }

    // default configration values if not set.
    newConfig.pandoraBrowserItemsPerRow = newConfig.pandoraBrowserItemsPerRow || 4;
    newConfig.pandoraBrowserItemsHideTitle = newConfig.pandoraBrowserItemsHideTitle || false;

    newConfig.playerHeaderHide = newConfig.playerHeaderHide || false;
    newConfig.playerHeaderHideProgressBar = newConfig.playerHeaderHideProgressBar || false;
    newConfig.playerControlsHideFavorites = newConfig.playerControlsHideFavorites || false;
    newConfig.playerControlsHidePlayPause = newConfig.playerControlsHidePlayPause || false;
    newConfig.playerControlsHideRepeat = newConfig.playerControlsHideRepeat || false;
    newConfig.playerControlsHideShuffle = newConfig.playerControlsHideShuffle || false;
    newConfig.playerControlsHideToneControls = newConfig.playerControlsHideToneControls || false;
    newConfig.playerControlsHideTrackNext = newConfig.playerControlsHideTrackNext || false;
    newConfig.playerControlsHideTrackPrev = newConfig.playerControlsHideTrackPrev || false;

    newConfig.presetBrowserItemsPerRow = newConfig.presetBrowserItemsPerRow || 3;
    newConfig.presetBrowserItemsHideSubTitle = newConfig.presetBrowserItemsHideSubTitle || false;
    newConfig.presetBrowserItemsHideTitle = newConfig.presetBrowserItemsHideTitle || false;

    newConfig.recentBrowserItemsPerRow = newConfig.recentBrowserItemsPerRow || 4;
    newConfig.recentBrowserItemsHideSubTitle = newConfig.recentBrowserItemsHideSubTitle || false;
    newConfig.recentBrowserItemsHideTitle = newConfig.recentBrowserItemsHideTitle || false;

    newConfig.sourceBrowserItemsPerRow = newConfig.sourceBrowserItemsPerRow || 1;

    newConfig.userPresetBrowserItemsPerRow = newConfig.userPresetBrowserItemsPerRow || 4;
    newConfig.userPresetBrowserItemsHideSubTitle = newConfig.userPresetBrowserItemsHideSubTitle || false;
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
      newConfig.sections = [Section.PLAYER];
      Store.selectedConfigArea = ConfigArea.GENERAL;
    }

    // store configuration so other card sections can access them.
    this.config = newConfig;

    debuglog("%csetConfig - Configuration changes stored\n%s",
      "color:orange",
      JSON.stringify(newConfig, null, 2),
    );
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
   * the rendered card (to the right of the editor).
  */
  public static getConfigElement() {

    // initialize what configarea to display on entry - always GENERAL, since this is a static method.
    Store.selectedConfigArea = ConfigArea.GENERAL;

    // clear card editor first render settings.
    Store.hasCardEditLoadedMediaList = {};

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

      pandoraBrowserTitle: "Pandora Stations ({medialist.filteritemcount} items, {medialist.lastupdatedon})",
      pandoraBrowserSubTitle: "click an item to play the content",
      pandoraBrowserItemsPerRow: 4,
      pandoraBrowserItemsHideTitle: false,
      pandoraBrowserItemsHideSubTitle: true,

      playerHeaderTitle: '{player.source_noaccount}',
      playerHeaderArtistTrack: "{player.media_artist} - {player.media_title}",
      playerHeaderAlbum: "{player.media_album_name} {player.sp_playlist_name_title}",
      playerHeaderNoMediaPlayingText: "\"{player.name}\" state is \"{player.state}\"",

      presetBrowserTitle: "\"{player.name}\" Presets ({medialist.filteritemcount} items, {medialist.lastupdatedon})",
      presetBrowserSubTitle: "click an item to select preset; click-hold to store preset",
      presetBrowserItemsPerRow: 3,
      presetBrowserItemsHideTitle: false,
      presetBrowserItemsHideSubTitle: false,

      recentBrowserTitle: "Recently Played ({medialist.filteritemcount} items, {medialist.lastupdatedon})",
      recentBrowserSubTitle: "click an item to play content",
      recentBrowserItemsPerRow: 4,
      recentBrowserItemsHideTitle: false,
      recentBrowserItemsHideSubTitle: false,

      sourceBrowserTitle: "\"{player.name}\" Sources ({medialist.filteritemcount} items)",
      sourceBrowserSubTitle: "click an item to select source; click-hold for actions",
      sourceBrowserItemsPerRow: 1,
      sourceBrowserItemsHideTitle: false,
      sourceBrowserItemsHideSubTitle: true,

      userPresetBrowserTitle: "User Presets for \"{player.name}\" ({medialist.filteritemcount} items)",
      userPresetBrowserSubTitle: "click an item to play content; click-hold for actions",
      userPresetBrowserItemsPerRow: 4,
      userPresetBrowserItemsHideTitle: false,
      userPresetBrowserItemsHideSubTitle: false,

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
        "X_default": "/local/images/soundtouchplus_card_customimages/default.png",
        "X_empty preset": "/local/images/soundtouchplus_card_customimages/empty_preset.png",
        "X_Daily Mix 1": "https://brands.home-assistant.io/soundtouchplus/icon.png",
        "X_playerOffBackground": "/local/images/soundtouchplus_card_customimages/playerOffBackground.png",
        "X_playerBackground": "/local/images/soundtouchplus_card_customimages/playerBackground.png",
      }
    }
  }


  /**
   * Style the <ha-card> element.
  */
  private styleCard() {

    // load basic layout settings.
    let cardWidth: string | undefined = undefined;
    let cardHeight: string | undefined = undefined;
    let editTabHeight = '0px';
    let editBottomToolbarHeight = '0px';
    const cardWaitProgressSliderColor = this.config.cardWaitProgressSliderColor;

    // build style info object.
    const styleInfo: StyleInfo = <StyleInfo>{};
    if (cardWaitProgressSliderColor)
      styleInfo['--stpc-card-wait-progress-slider-color'] = `${cardWaitProgressSliderColor}`;

    // are we previewing the card in the card editor?
    // if so, then we will ignore the configuration dimensions and use constants.
    if (this.isCardInEditPreview) {

      // card is in edit preview.
      styleInfo['--stpc-card-edit-tab-height'] = `${editTabHeight}`;
      styleInfo['--stpc-card-edit-bottom-toolbar-height'] = `${editBottomToolbarHeight}`;
      styleInfo['height'] = `${CARD_EDIT_PREVIEW_HEIGHT}`;
      styleInfo['width'] = `${CARD_EDIT_PREVIEW_WIDTH}`;
      styleInfo['background-repeat'] = `${!this.playerId ? 'no-repeat' : undefined}`;
      styleInfo['background-position'] = `${!this.playerId ? 'center' : undefined}`;
      styleInfo['background-image'] = `${!this.playerId ? 'url(' + BRAND_LOGO_IMAGE_BASE64 + ')' : undefined}`;
      styleInfo['background-size'] = `${!this.playerId ? BRAND_LOGO_IMAGE_SIZE : undefined}`;
      return styleMap(styleInfo);
    }


    // set card picker options.
    if (isCardInPickerPreview(this)) {

      // card is in pick preview.
      styleInfo['--stpc-card-edit-tab-height'] = `${editTabHeight}`;
      styleInfo['--stpc-card-edit-bottom-toolbar-height'] = `${editBottomToolbarHeight}`;
      styleInfo['height'] = `${CARD_PICK_PREVIEW_HEIGHT}`;
      styleInfo['width'] = `${CARD_PICK_PREVIEW_WIDTH}`;
      styleInfo['background-repeat'] = 'no-repeat';
      styleInfo['background-position'] = 'center';
      styleInfo['background-image'] = `url(${BRAND_LOGO_IMAGE_BASE64})`;
      styleInfo['background-size'] = `${BRAND_LOGO_IMAGE_SIZE}`;
      return styleMap(styleInfo);
    }

    // set card editor options.
    // we have to account for various editor toolbars in the height calculations when using 'fill' mode.
    // we do not have to worry about width calculations, as the width is the same with or without edit mode.
    if (isCardInDashboardEditor()) {

      // dashboard is in edit mode.
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

    //console.log("styleCard (card) - calculated dimensions:\n- cardWidth=%s\n- cardHeight=%s\n- editTabHeight=%s\n- editBottomToolbarHeight=%s",
    //  cardWidth,
    //  cardHeight,
    //  editTabHeight,
    //  editBottomToolbarHeight,
    //);

    // build style info object.
    styleInfo['--stpc-card-edit-tab-height'] = `${editTabHeight}`;
    styleInfo['--stpc-card-edit-bottom-toolbar-height'] = `${editBottomToolbarHeight}`;
    styleInfo['height'] = `${cardHeight ? cardHeight : undefined}`;
    styleInfo['width'] = `${cardWidth ? cardWidth : undefined}`;
    return styleMap(styleInfo);
  }


  /**
   * Style the card header element.
   */
  private styleCardHeader() {

    // is player selected, and a title set?
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


  /**
   * Style the <stpc-card-background-container> element.
   */
  private styleCardFooter() {

    // set footer icon size.
    const footerIconSize = this.config.footerIconSize || FOOTER_ICON_SIZE_DEFAULT;

    // is player selected, and a footer background color set?
    if ((this.section == Section.PLAYER) && (this.footerBackgroundColor)) {

      // yes - return vibrant background style.
      return styleMap({
        '--stpc-footer-icon-size': `${footerIconSize}`,
        '--stpc-footer-icon-button-size': `var(--stpc-footer-icon-size, ${FOOTER_ICON_SIZE_DEFAULT}) + 0.75rem`,
        '--stpc-player-footer-bg-color': `${this.footerBackgroundColor || 'transparent'}`,
      });

    } else {

      // return style map (let background color default to the card background color).
      return styleMap({
        '--stpc-footer-icon-size': `${footerIconSize}`,
        '--stpc-footer-icon-button-size': `var(--stpc-footer-icon-size, ${FOOTER_ICON_SIZE_DEFAULT}) + 0.75rem`,
        'background': 'unset',
      });

    }
  }


  /**
   * Updates the SoundTouchDevice state.
   */
  private updateSoundTouchDevice(player: MediaPlayer): boolean {

    // check if update is already in progress.
    // this method is called from `render`, which could fire multiple times!
    if (!this.isUpdateInProgress) {
      this.isUpdateInProgress = true;
      this.isGetDeviceInfoCalled = true
    } else {
      return false;
    }

    if (debuglog.enabled) {
      debuglog("updateSoundTouchDevice - updating SoundTouch device information");
    }

    // clear alerts.
    this.alertClear();

    try {

      // we use the `Promise.allSettled` approach here, so that we can easily 
      // add promises if more data gathering is needed in the future.
      const promiseRequests = new Array<Promise<unknown>>();

      // create promise - get media list.
      const promiseGetDeviceInfo = new Promise((resolve, reject) => {

        // call the service to retrieve the device info.
        this.store.soundTouchPlusService.GetDeviceInfo(player)
          .then(result => {

            // load media list results.
            this.soundTouchDevice = result;

            if (debuglog.enabled) {
              debuglog("%cupdateSoundTouchDevice - soundTouchDevice was updated from GetDeviceInfo service",
                "color: gold;",
              );
            }

            // resolve the promise.
            resolve(true);

          })
          .catch(error => {

            // clear results, and reject the promise.
            this.soundTouchDevice = undefined;

            // call base class method, indicating media list update failed.
            this.alertErrorSet("Get SoundTouch Device Info failed: " + getHomeAssistantErrorMessage(error));

            // reject the promise.
            reject(error);

          })
      });

      promiseRequests.push(promiseGetDeviceInfo);

      // show visual progress indicator.
      this.progressShow();

      // execute all promises, and wait for all of them to settle.
      // we use `finally` logic so we can clear the progress indicator.
      // any exceptions raised should have already been handled in the 
      // individual promise definitions; nothing else to do at this point.
      Promise.allSettled(promiseRequests).finally(() => {

        // clear the progress indicator.
        this.progressHide();

      });

      return true;

    }
    catch (error) {

      // clear the progress indicator.
      this.progressHide();

      // clear informational alerts.
      this.alertInfoClear();

      // set alert error message.
      this.alertErrorSet("Device refresh failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {

    }
  }

}
