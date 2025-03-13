// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":player");

// lovelace card imports.
import { css, html, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from "lit/decorators.js";
import { styleMap, StyleInfo } from 'lit-html/directives/style-map.js';

// ** IMPORTANT - Vibrant notes:
// ensure that you have "compilerOptions"."lib": [ ... , "WebWorker" ] specified
// in your tsconfig.json!  If not, the Vibrant module will not initialize correctly
// and you will tear your hair out trying to figure out why it doesn't work!!!
import Vibrant from 'node-vibrant/dist/vibrant';

// our imports - card components.
import '../components/player-header';
import '../components/player-body-idle';
import '../components/player-body-tone-controls';
import '../components/player-controls';
import '../components/player-volume';

// our imports.
import {
  BRAND_LOGO_IMAGE_BASE64,
  BRAND_LOGO_IMAGE_SIZE,
  PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT,
  PLAYER_CONTROLS_ICON_SIZE_DEFAULT
} from '../constants';
import { CardConfig } from '../types/card-config';
import { Store } from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { Palette } from '@vibrant/color';
import { AlertUpdatesBase } from './alert-updates-base';


@customElement("stpc-player")
export class Player extends AlertUpdatesBase {

  // public state properties.
  @property({ attribute: false }) mediaContentId!: string;

  // private storage.
  @state() private config!: CardConfig;
  @state() private playerImage?: string;
  @state() private _colorPaletteVibrant?: string;
  @state() private _colorPaletteMuted?: string;
  @state() private _colorPaletteDarkVibrant?: string;
  @state() private _colorPaletteDarkMuted?: string;
  @state() private _colorPaletteLightVibrant?: string;
  @state() private _colorPaletteLightMuted?: string;

  /** MediaPlayer instance created from the configuration entity id. */
  private player!: MediaPlayer;


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // set common references from application common storage area.
    this.config = this.store.config;
    this.player = this.store.player;

    // get idle state in case we are minimizing height.
    const isOffIdle = this.player.isPoweredOffOrIdle();

    // render html.
    return html`
      <div class="player-section-container" style=${this.stylePlayerSection()}>
        <stpc-player-header style=${this.stylePlayerHeader()}
          class="player-section-header"
          .store=${this.store}
        ></stpc-player-header>
        <div class="player-section-body">
          <div class="player-alert-bgcolor">
            ${this.alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this.alertErrorClear}>${this.alertError}</ha-alert>` : ""}
            ${this.alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this.alertInfoClear}>${this.alertInfo}</ha-alert>` : ""}
          </div>
          ${(() => {
            if (isOffIdle && this.config.playerMinimizeOnIdle && this.config.height != "fill") {
              return (html`<stpc-player-body-idle class="player-section-body-content" style="display:block" .store=${this.store}></stpc-player-body-idle>`);
            } else if ((this.config.playerControlsHideFavorites || false) == true) {
              return (html``); // if favorites disabled then we don't need to display favorites body.
            } else {
              return (html`<div class="player-section-body-content"></div>`);
            }
          })()}
          ${(() => {
            if (isOffIdle && this.config.playerMinimizeOnIdle && this.config.height != "fill") {
              return (html``); // if idle then we don't need to display queue body.
            } else if ((this.config.playerControlsHideToneControls || false) == true) {
              return (html``); // if tone controls disabled then we don't need to display anything in the body.
            } else {
              return (html`<stpc-player-body-tone-controls class="player-section-body-tone-controls" .store=${this.store} .mediaContentId=${this.mediaContentId} id="elmPlayerBodyToneControls"></stpc-player-body-tone-controls>`);
            }
          })()}
        </div>
        <stpc-player-controls style=${this.stylePlayerControls()}
          class="player-section-controls"
          .store=${this.store}
          .mediaContentId=${this.mediaContentId}
        ></stpc-player-controls>
      </div>
    `;
  }


  /**
   * style definitions used by this component.
   * */
  static get styles() {

    return css`

      .hoverable:focus,
      .hoverable:hover {
        color: var(--dark-primary-color);
      }

      .hoverable:active {
        color: var(--primary-color);
      }

      .player-section-container {
        display: grid;
        grid-template-columns: 100%;
        grid-template-rows: min-content auto min-content;
        grid-template-areas:
          'header'
          'body'
          'controls';
        align-items: center;
        background-position: center;
        background-repeat: no-repeat;
        background-size: var(--stpc-player-background-size, 100% 100%);  /* PLAYER_BACKGROUND_IMAGE_SIZE_DEFAULT */
        text-align: -webkit-center;
        height: 100%;
        width: 100%;
      }

      .player-section-header {
        /* border: 1px solid red;      /* FOR TESTING CONTROL LAYOUT CHANGES */
        grid-area: header;
        background: linear-gradient(180deg, var(--stpc-player-header-bg-color) 30%, transparent 100%);
        background-repeat: no-repeat;
        padding: 0.2rem;
      }

      .player-section-body {
        /* border: 1px solid orange;   /* FOR TESTING CONTROL LAYOUT CHANGES */
        grid-area: body;
        height: 100%;
        overflow: hidden;
        padding: 0rem 0.5rem 0rem 0.5rem;
        box-sizing: border-box;
        background: transparent;
      }

      .player-section-body-content {
        /* border: 1px solid yellow;   /* FOR TESTING CONTROL LAYOUT CHANGES */
        height: inherit;
        background: transparent;
        overflow: hidden;
        display: none;              /* don't display initially */
        /* for fade-in, fade-out support */
        transition: opacity 0.25s, display 0.25s;
        transition-behavior: allow-discrete;    /* Note: be sure to write this after the shorthand */
      }

      .player-section-body-tone-controls {
        /* border: 1px solid yellow;   /* FOR TESTING CONTROL LAYOUT CHANGES */
        height: inherit;
        background: transparent;
        overflow: hidden;
        display: none;              /* don't display initially */
        /* for fade-in, fade-out support */
        transition: opacity 0.25s, display 0.25s;
        transition-behavior: allow-discrete;    /* Note: be sure to write this after the shorthand */
      }

      .player-section-controls {
        /* border: 1px solid blue;     /* FOR TESTING CONTROL LAYOUT CHANGES */
        grid-area: controls;
        overflow-y: auto;
        background: linear-gradient(0deg, var(--stpc-player-controls-bg-color) 30%, transparent 100%);
        background-repeat: no-repeat;
      }

      /* have to set a background color for alerts due to parent background transparency. */
      .player-alert-bgcolor {
        background-color: rgba(var(--rgb-card-background-color), 0.92);
      }

    `;
  }


  /**
   * Returns an element style for the player section.
   */
  private stylePlayerSection() {

    // get default player background size.
    let backgroundSize: string | undefined;

    // allow user configuration to override background size.
    if (this.config.playerBackgroundImageSize) {
      backgroundSize = this.config.playerBackgroundImageSize;
    }

    // if not configured AND in fill mode, then do not stretch the background image.
    if ((!backgroundSize) && (this.config.width == 'fill')) {
      backgroundSize = 'contain';
    }

    // get various image source settings.
    const configImagePlayerBg = this.config.customImageUrls?.['playerBackground'];
    const configImagePlayerIdleBg = this.config.customImageUrls?.['playerIdleBackground'];
    const configImagePlayerOffBg = this.config.customImageUrls?.['playerOffBackground'];
    const configImageDefault = this.config.customImageUrls?.['default'];

    // if player is off | idle | unknown, then reset the playerImage value so that one
    // of the default images is selected below.
    if (this.player.isPoweredOffOrIdle()) {
      this.playerImage = undefined;
      this.store.card.footerBackgroundColor = undefined;
    }

    const isOff = this.player.isPoweredOffOrUnknown();
    const isIdle = this.player.isIdle();

    //console.log("%cstylePlayerSection - styling player section:\n- isOff = %s\n- isIdle = %s\n- playerImage = %s\n- playerMinimizeOnIdle = %s\n- configImagePlayerIdleBg = %s\n- configImagePlayerOffBg = %s\n- configImageDefault = %s\n- configImagePlayerBg = %s",
    //  "color:red",
    //  JSON.stringify(isOff),
    //  JSON.stringify(isIdle),
    //  JSON.stringify(this.playerImage),
    //  JSON.stringify(this.config.playerMinimizeOnIdle),
    //  JSON.stringify(configImagePlayerIdleBg),
    //  JSON.stringify(configImagePlayerOffBg),
    //  JSON.stringify(configImageDefault),
    //  JSON.stringify(configImagePlayerBg),
    //);

    // set background image to display.
    let imageUrl: string = "";
    let headerBackgroundColor = 'transparent';
    let controlsBackgroundColor = 'transparent';

    if (isIdle && this.config.playerMinimizeOnIdle) {

      // no background image if player is minimized.

    } else if (isIdle && configImagePlayerIdleBg) {

      // use configured player idle background image.
      imageUrl = configImagePlayerIdleBg;
      if ((imageUrl + "").toLowerCase() == "none") {
        imageUrl = "";
      }

    } else if (isOff && this.config.playerMinimizeOnIdle) {

      // no background image if player is minimized.

    } else if (isOff && configImagePlayerOffBg) {

      // use configured player off background image.
      imageUrl = configImagePlayerOffBg;
      if ((imageUrl + "").toLowerCase() == "none") {
        imageUrl = "";
      }

    } else if (configImagePlayerBg) {

      // use configured player background image (static image, does not change).
      imageUrl = configImagePlayerBg;
      headerBackgroundColor = this.config.playerHeaderBackgroundColor || PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT;
      controlsBackgroundColor = this.config.playerControlsBackgroundColor || PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT;

    } else if (this.playerImage) {

      // use currently playing artwork background image; image changes with the track.
      imageUrl = this.playerImage;
      headerBackgroundColor = this.config.playerHeaderBackgroundColor || PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT;
      controlsBackgroundColor = this.config.playerControlsBackgroundColor || PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT;

    } else if (configImageDefault) {

      // use configured default background image.
      imageUrl = configImageDefault;
      backgroundSize = BRAND_LOGO_IMAGE_SIZE;
      this.store.card.footerBackgroundColor = undefined;

    } else {

      // use hard-coded default background image.
      imageUrl = BRAND_LOGO_IMAGE_BASE64;
      backgroundSize = BRAND_LOGO_IMAGE_SIZE;
      this.store.card.footerBackgroundColor = undefined;

    }

    // set player controls and volume controls icon size.
    const playerControlsIconSize = this.config.playerControlsIconSize || PLAYER_CONTROLS_ICON_SIZE_DEFAULT;
    const playerControlsIconColor = this.config.playerControlsIconColor;
    const playerControlsIconToggleColor = this.config.playerControlsIconToggleColor;
    const playerControlsColor = this.config.playerControlsColor;
    const playerHeaderTitle1Color = this.config.playerHeaderTitle1Color;
    const playerHeaderTitle1FontSize = this.config.playerHeaderTitle1FontSize;
    const playerHeaderTitle2Color = this.config.playerHeaderTitle2Color;
    const playerHeaderTitle2FontSize = this.config.playerHeaderTitle2FontSize;
    const playerHeaderTitle3Color = this.config.playerHeaderTitle3Color;
    const playerHeaderTitle3FontSize = this.config.playerHeaderTitle3FontSize;
    const playerProgressSliderColor = this.config.playerProgressSliderColor;
    const playerProgressLabelColor = this.config.playerProgressLabelColor;
    const playerVolumeSliderColor = this.config.playerVolumeSliderColor;
    const playerVolumeLabelColor = this.config.playerVolumeLabelColor;

    // build style info object.
    const styleInfo: StyleInfo = <StyleInfo>{};
    styleInfo['background-image'] = `url(${imageUrl})`;
    if (backgroundSize)
      styleInfo['--stpc-player-background-size'] = `${backgroundSize}`;
    styleInfo['--stpc-player-header-bg-color'] = `${headerBackgroundColor}`;
    styleInfo['--stpc-player-controls-bg-color'] = `${controlsBackgroundColor} `;
    if (playerControlsColor)
      styleInfo['--stpc-player-controls-color'] = `${playerControlsColor}`;
    if (playerControlsIconToggleColor)
      styleInfo['--stpc-player-controls-icon-toggle-color'] = `${playerControlsIconToggleColor}`;
    if (playerControlsIconColor)
      styleInfo['--stpc-player-controls-icon-color'] = `${playerControlsIconColor}`;
    if (playerControlsIconSize)
      styleInfo['--stpc-player-controls-icon-size'] = `${playerControlsIconSize}`;
    styleInfo['--stpc-player-controls-icon-button-size'] = `var(--stpc-player-controls-icon-size, ${PLAYER_CONTROLS_ICON_SIZE_DEFAULT}) + 0.75rem`;
    if (playerHeaderTitle1Color)
      styleInfo['--stpc-player-header-title1-color'] = `${playerHeaderTitle1Color}`;
    if (playerHeaderTitle1FontSize)
      styleInfo['--stpc-player-header-title1-font-size'] = `${playerHeaderTitle1FontSize}`;
    if (playerHeaderTitle2Color)
      styleInfo['--stpc-player-header-title2-color'] = `${playerHeaderTitle2Color}`;
    if (playerHeaderTitle2FontSize)
      styleInfo['--stpc-player-header-title2-font-size'] = `${playerHeaderTitle2FontSize}`;
    if (playerHeaderTitle3Color)
      styleInfo['--stpc-player-header-title3-color'] = `${playerHeaderTitle3Color}`;
    if (playerHeaderTitle3FontSize)
      styleInfo['--stpc-player-header-title3-font-size'] = `${playerHeaderTitle3FontSize}`;
    if (playerProgressLabelColor)
      styleInfo['--stpc-player-progress-label-color'] = `${playerProgressLabelColor}`;
    if (playerProgressSliderColor)
      styleInfo['--stpc-player-progress-slider-color'] = `${playerProgressSliderColor}`;
    if (playerVolumeLabelColor)
      styleInfo['--stpc-player-volume-label-color'] = `${playerVolumeLabelColor}`;
    if (playerVolumeSliderColor)
      styleInfo['--stpc-player-volume-slider-color'] = `${playerVolumeSliderColor}`;

    styleInfo['--stpc-player-palette-vibrant'] = `${this._colorPaletteVibrant}`;
    styleInfo['--stpc-player-palette-muted'] = `${this._colorPaletteMuted}`;
    styleInfo['--stpc-player-palette-darkvibrant'] = `${this._colorPaletteDarkVibrant}`;
    styleInfo['--stpc-player-palette-darkmuted'] = `${this._colorPaletteDarkMuted}`;
    styleInfo['--stpc-player-palette-lightvibrant'] = `${this._colorPaletteLightVibrant}`;
    styleInfo['--stpc-player-palette-lightmuted'] = `${this._colorPaletteLightMuted}`;

    return styleMap(styleInfo);

  }


  /**
   * Returns an element style for the header portion of the form.
   */
  private stylePlayerHeader() {

    // build style info object.
    const styleInfo: StyleInfo = <StyleInfo>{};

    // show / hide the header.
    if (this.config.playerHeaderHide || false)
      styleInfo['display'] = `none`;

    // adjust css styling for minimized player format.
    if (this.config.playerMinimizeOnIdle && this.store.player.isPoweredOffOrIdle()) {
      if (this.config.height != 'fill') {
        styleInfo['display'] = `none`;
      }
    }

    return styleMap(styleInfo);
  }


  /**
   * Returns an element style for the player controls portion of the form.
   */
  private stylePlayerControls() {

    // build style info object.
    const styleInfo: StyleInfo = <StyleInfo>{};

    // show / hide the media controls.
    if (this.config.playerControlsHide || false)
      styleInfo['display'] = `none`;

    // adjust css styling for minimized player format.
    if (this.config.playerMinimizeOnIdle && this.store.player.isPoweredOffOrIdle()) {
      if (this.config.height != 'fill') {
        styleInfo['justify-items'] = `flex-start`;
      }
    }

    return styleMap(styleInfo);
  }


  /**
   * Invoked before `update()` to compute values needed during the update.
   * 
   * We will check for changes in the media player background image.  If a
   * change is being made, then we will analyze the new image for the vibrant
   * color palette.  We will then set some css variables with those values for
   * use by the different player sections (header, progress, volume, etc). 
   */
  protected willUpdate(changedProperties: PropertyValues): void {

    // invoke base class method.
    super.willUpdate(changedProperties);

    // get list of changed property keys.
    const changedPropKeys = Array.from(changedProperties.keys())

    //if (debuglog.enabled) {
    //  debuglog("willUpdate - changed property keys:\n",
    //    JSON.stringify(changedPropKeys),
    //  );
    //}

    // we only care about "store" property changes at this time, as it contains a
    // reference to the "hass" property.  we are looking for background image changes.
    if (!changedPropKeys.includes('store')) {
      return;
    }

    let oldImage: string | undefined = undefined;
    let newImage: string | undefined = undefined;

    // get the old property reference.
    const oldStore = changedProperties.get('store') as Store;
    if (oldStore) {

      // if a media player was assigned to the store, then get the player image.
      // we use the `stp_nowplaying_image_url` custom attribute for the image.
      // note that we cannot use the `media_image_url`, `entity_picture`, nor
      // `entity_picture_local` attributes for various reasons found in testing.
      const oldPlayer = oldStore.player;
      if (oldPlayer) {
        oldImage = oldPlayer.attributes.stp_nowplaying_image_url;
      }
    }

    //console.log("willUpdate (player) - oldPlayer image:\n%s",
    //  JSON.stringify(oldImage),
    //);

    // check if the player reference is set (in case it was set to undefined).
    if (this.store.player) {

      // get the current media player image.
      // if image not set, then there's nothing left to do.
      newImage = this.store.player.attributes.stp_nowplaying_image_url;
      if (newImage) {
        this.playerImage = newImage;
      } else {
        return;
      }
    }

    // did the image change?  if so, then extract the color differences from the associated image.
    // if we are editing the card, then we don't care about vibrant colors.
    // note that we cannot compare entity_picture here, as it's a cached value and the `cache`
    // portion of the image url could change even though it's the same content that's playing!
    if ((oldImage != newImage) && (!this.isCardInEditPreview)) {

      if (debuglog.enabled) {
        debuglog("willUpdate - player content changed:\n- OLD IMAGE = %s\n- NEW IMAGE = %s",
          JSON.stringify(oldImage),
          JSON.stringify(newImage),
        );
      }

      // extract the color differences from the new image and set the player colors.
      this._extractColors();

      // store the new media id in the exposed property so that other forms
      // are informed of the change.
      this.mediaContentId = newImage || "";

    }
  }


  /**
   * Extracts color compositions from the background image, which will be used for 
   * rendering controls that are displayed on top of the background image.
   * 
   * Good resource on the Vibrant package parameters, examples, and other info:
   * https://github.com/Vibrant-Colors/node-vibrant
   * https://kiko.io/post/Get-and-use-a-dominant-color-that-matches-the-header-image/
   * https://jariz.github.io/vibrant.js/
   * https://github.com/Vibrant-Colors/node-vibrant/issues/44
   */
  private async _extractColors(): Promise<void> {

    //console.log("_extractColors TODO TEST - extracting vibrant colors from image:\n- playerImage = %s",
    //  JSON.stringify(this.playerImage),
    //);

    //console.log("_extractColors (player) - colors before extract:\n- Vibrant      = %s\n- Muted        = %s\n- DarkVibrant  = %s\n- DarkMuted    = %s\n- LightVibrant = %s\n- LightMuted   = %s",
    //  this._colorPaletteVibrant,
    //  this._colorPaletteMuted,
    //  this._colorPaletteDarkVibrant,
    //  this._colorPaletteDarkMuted,
    //  this._colorPaletteLightVibrant,
    //  this._colorPaletteLightMuted,
    //);

    if (this.playerImage) {

      // set options for vibrant call.
      const vibrantOptions = {
        "colorCount": 64, // amount of colors in initial palette from which the swatches will be generated.
        "quality": 3,     // quality. 0 is highest, but takes way more processing.
        //  "quantizer": 'mmcq',
        //  "generators": ['default'],
        //  "filters": ['default'],
      }

      // create vibrant instance with our desired options.
      const vibrant: Vibrant = new Vibrant(this.playerImage || '', vibrantOptions);

      // get the color palettes for the player background image.
      await vibrant.getPalette().then(
        (palette: Palette) => {

          //console.log("_extractColors (player) - colors found by getPalette:\n- Vibrant      = %s\n- Muted        = %s\n- DarkVibrant  = %s\n- DarkMuted    = %s\n- LightVibrant = %s\n- LightMuted   = %s",
          //  (palette['Vibrant']?.hex) || 'undefined',
          //  (palette['Muted']?.hex) || 'undefined',
          //  (palette['DarkVibrant']?.hex) || 'undefined',
          //  (palette['DarkMuted']?.hex) || 'undefined',
          //  (palette['LightVibrant']?.hex) || 'undefined',
          //  (palette['LightMuted']?.hex) || 'undefined',
          //);

          // set player color palette values.
          this._colorPaletteVibrant = (palette['Vibrant']?.hex) || undefined;
          this._colorPaletteMuted = (palette['Muted']?.hex) || undefined;
          this._colorPaletteDarkVibrant = (palette['DarkVibrant']?.hex) || undefined;
          this._colorPaletteDarkMuted = (palette['DarkMuted']?.hex) || undefined;
          this._colorPaletteLightVibrant = (palette['LightVibrant']?.hex) || undefined;
          this._colorPaletteLightMuted = (palette['LightMuted']?.hex) || undefined;

          // set card footer background color.
          this.store.card.footerBackgroundColor = this._colorPaletteVibrant;

        },
        (_reason: string) => {

          if (debuglog.enabled) {
            debuglog("_extractColors - Could not retrieve color palette info for player background image\nreason = %s",
              JSON.stringify(_reason),
            );
          }

          // reset player color palette values.
          this._colorPaletteVibrant = undefined;
          this._colorPaletteMuted = undefined;
          this._colorPaletteDarkVibrant = undefined;
          this._colorPaletteDarkMuted = undefined;
          this._colorPaletteLightVibrant = undefined;
          this._colorPaletteLightMuted = undefined;

          // set card footer background color.
          this.store.card.footerBackgroundColor = this._colorPaletteVibrant;

        }
      );
    }
  }
}
