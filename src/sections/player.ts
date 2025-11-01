// lovelace card imports.
import { css, html, TemplateResult, unsafeCSS } from 'lit';
import { customElement, property, state } from "lit/decorators.js";
import { styleMap, StyleInfo } from 'lit-html/directives/style-map.js';

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
import { MediaPlayer } from '../model/media-player';
import { AlertUpdatesBase } from './alert-updates-base';


@customElement("stpc-player")
export class Player extends AlertUpdatesBase {

  // public state properties.
  @property({ attribute: false }) mediaContentId!: string;

  // private storage.
  @state() private config!: CardConfig;

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
              return (html`<stpc-player-body-tone-controls class="player-section-body-content" .store=${this.store} .mediaContentId=${this.mediaContentId} id="elmPlayerBodyToneControls"></stpc-player-body-tone-controls>`);
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
        background-size: var(--stpc-player-background-size, var(--stpc-player-background-size-default, 100% 100%));  /* PLAYER_BACKGROUND_IMAGE_SIZE_DEFAULT */
        text-align: -webkit-center;
        height: 100%;
        width: 100%;
      }

      .player-section-header {
        /* border: 1px solid red;      /* FOR TESTING CONTROL LAYOUT CHANGES */
        grid-area: header;
        background: linear-gradient(180deg, var(--stpc-player-header-bg-color, ${unsafeCSS(PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT)}) 30%, transparent 100%);
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

      .player-section-controls {
        /* border: 1px solid blue;     /* FOR TESTING CONTROL LAYOUT CHANGES */
        grid-area: controls;
        overflow-y: auto;
        background: linear-gradient(0deg, var(--stpc-player-controls-bg-color, ${unsafeCSS(PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT)}) 30%, transparent 100%);
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

    // build style info object.
    const styleInfo: StyleInfo = <StyleInfo>{};

    // get player states.
    const isOff = this.player.isPoweredOffOrUnknown();
    const isIdle = this.player.isIdle();

    // initialize default player background image and colors.
    let backgroundImageUrl: string | undefined;
    let isBackgroundImageBrandLogo: boolean = false;

    // get various image source settings.
    const configImageDefault = this.config.customImageUrls?.['default'];
    const configImagePlayerBg = this.config.customImageUrls?.['playerBackground'];
    const configImagePlayerBgIdle = this.config.customImageUrls?.['playerIdleBackground'];
    const configImagePlayerBgOff = this.config.customImageUrls?.['playerOffBackground'];

    // get current media player image and media content id values.
    // we use the `stp_nowplaying_image_url` custom attribute for the image.
    // note that we cannot use the `media_image_url`, `entity_picture`, nor
    // `entity_picture_local` attributes for various reasons found in testing.
    let playerMediaContentId: string | undefined = undefined;
    let playerImage: string | undefined = undefined;
    if (this.store.player) {
      playerMediaContentId = this.store.player.attributes.media_content_id;
      playerImage = this.store.player.attributes.stp_nowplaying_image_url;
    }

    //console.log("%cstylePlayerSection - styling player section:\n- isOff = %s\n- isIdle = %s\n- playerImage = %s\n- playerMinimizeOnIdle = %s\n- configImageDefault = %s\n- configImagePlayerBg = %s",
    //  "color:red",
    //  JSON.stringify(isOff),
    //  JSON.stringify(isIdle),
    //  JSON.stringify(playerImage),
    //  JSON.stringify(this.config.playerMinimizeOnIdle),
    //  JSON.stringify(configImageDefault),
    //  JSON.stringify(configImagePlayerBg),
    //);

    // is specific background size specified in config? if so, then use it.
    // otherwise, do not stretch the background image if in fill mode.
    if (this.config.playerBackgroundImageSize) {
      styleInfo['--stpc-player-background-size'] = `${this.config.playerBackgroundImageSize}`;
    } else if (this.config.width == 'fill') {
      styleInfo['--stpc-player-background-size-default'] = 'contain';
    }

    // set player background image to display.
    if (isOff) {

      // set image to display for OFF state.
      this.store.card.playerMediaContentId = "configImagePlayerBgOff"
      if ((configImagePlayerBgOff || "").toLowerCase() == "none") {
        // force no image.
        styleInfo['background-image'] = undefined;
      } else if (configImagePlayerBgOff) {
        // image specified in card config.
        styleInfo['background-image'] = `url(${configImagePlayerBgOff})`;
        backgroundImageUrl = configImagePlayerBgOff;
      } else if (this.config.playerMinimizeOnIdle) {
        // player is minimized, so use theme file image if defined (do not display brand logo).
        styleInfo['background-image'] = `var(--stpc-player-background-image-off)`;
      } else {
        // player is not minimized, so use theme file image if defined; otherwise, use brand logo.
        styleInfo['background-image'] = `var(--stpc-player-background-image-off, url(${BRAND_LOGO_IMAGE_BASE64}))`;
        styleInfo['--stpc-player-background-size-default'] = `${BRAND_LOGO_IMAGE_SIZE}`;
        isBackgroundImageBrandLogo = true;
      }

      // set image size.
      if (this.config.playerBackgroundImageSize) {
        styleInfo['--stpc-player-background-size'] = `${this.config.playerBackgroundImageSize}`;
      }

    } else if (isIdle) {

      // set image to display for IDLE state.
      this.store.card.playerMediaContentId = "configImagePlayerBgIdle"
      if ((configImagePlayerBgIdle || "").toLowerCase() == "none") {
        // force no image.
        styleInfo['background-image'] = undefined;
      } else if (configImagePlayerBgIdle) {
        // image specified in card config.
        styleInfo['background-image'] = `url(${configImagePlayerBgIdle})`;
        backgroundImageUrl = configImagePlayerBgIdle;
      } else if (this.config.playerMinimizeOnIdle) {
        // player is minimized, so use theme file image if defined (do not display brand logo).
        styleInfo['background-image'] = `var(--stpc-player-background-image-off)`;
      } else {
        // player is not minimized, so use theme file image if defined; otherwise, use brand logo.
        styleInfo['background-image'] = `var(--stpc-player-background-image-off, url(${BRAND_LOGO_IMAGE_BASE64}))`;
        styleInfo['--stpc-player-background-size-default'] = `${BRAND_LOGO_IMAGE_SIZE}`;
        isBackgroundImageBrandLogo = true;
      }

      // set image size.
      if (this.config.playerBackgroundImageSize) {
        styleInfo['--stpc-player-background-size'] = `${this.config.playerBackgroundImageSize}`;
      }

    } else if (configImagePlayerBg) {

      // use configured player background image (static image, does not change).
      this.store.card.playerMediaContentId = "configImagePlayerBg"
      if ((configImagePlayerBg || "").toLowerCase() == "none") {
        // force no image.
        styleInfo['background-image'] = undefined;
      } else if (configImagePlayerBg) {
        // image specified in card config.
        styleInfo['background-image'] = `url(${configImagePlayerBg})`;
        backgroundImageUrl = configImagePlayerBg;
      }

    } else if (playerImage) {

      // use currently playing artwork background image; image changes with the track.
      // note that theming variable will override this value if specified.
      this.store.card.playerMediaContentId = playerMediaContentId;
      backgroundImageUrl = playerImage;
      styleInfo['background-image'] = `var(--stpc-player-background-image, url(${playerImage}))`;

    } else if (configImageDefault) {

      // use configured default background image.
      this.store.card.playerMediaContentId = "configImageDefault"
      backgroundImageUrl = configImageDefault;
      styleInfo['background-image'] = `url(${configImageDefault}`;

    } else {

      // set image to display for all other possibilities.
      this.store.card.playerMediaContentId = "BRAND_LOGO_IMAGE_BASE64"
      if (this.config.playerMinimizeOnIdle) {
        // player is minimized, so use theme file image if defined (do not display brand logo).
        styleInfo['background-image'] = `var(--stpc-player-background-image-off)`;
      } else {
        // player is not minimized, so use theme file image if defined; otherwise, use brand logo.
        styleInfo['background-image'] = `var(--stpc-player-background-image-off, url(${BRAND_LOGO_IMAGE_BASE64}))`;
        styleInfo['--stpc-player-background-size-default'] = `${BRAND_LOGO_IMAGE_SIZE}`;
        isBackgroundImageBrandLogo = true;
      }

      // set image size.
      if (this.config.playerBackgroundImageSize) {
        styleInfo['--stpc-player-background-size'] = `${this.config.playerBackgroundImageSize}`;
      }

    }

    // set player controls and volume controls icon size.
    let playerControlsBackgroundColor = this.config.playerControlsBackgroundColor;
    const playerControlsColor = this.config.playerControlsColor;
    const playerControlsIconSize = this.config.playerControlsIconSize || PLAYER_CONTROLS_ICON_SIZE_DEFAULT;
    let playerControlsIconColor = this.config.playerControlsIconColor;
    const playerControlsIconToggleColor = this.config.playerControlsIconToggleColor;
    let playerHeaderBackgroundColor = this.config.playerHeaderBackgroundColor;
    let playerHeaderTitle1Color = this.config.playerHeaderTitle1Color;
    const playerHeaderTitle1FontSize = this.config.playerHeaderTitle1FontSize;
    let playerHeaderTitle2Color = this.config.playerHeaderTitle2Color;
    const playerHeaderTitle2FontSize = this.config.playerHeaderTitle2FontSize;
    let playerHeaderTitle3Color = this.config.playerHeaderTitle3Color;
    const playerHeaderTitle3FontSize = this.config.playerHeaderTitle3FontSize;
    const playerMinimizedTitleColor = this.config.playerMinimizedTitleColor;
    const playerMinimizedTitleFontSize = this.config.playerMinimizedTitleFontSize;
    const playerProgressSliderColor = this.config.playerProgressSliderColor;
    const playerProgressLabelColor = this.config.playerProgressLabelColor;
    const playerVolumeSliderColor = this.config.playerVolumeSliderColor;
    let playerVolumeLabelColor = this.config.playerVolumeLabelColor;

    // if brand logo image is in use, then default the header and controls area
    // background to transparent, and all labels to the primary text color (since the 
    // brand logo image is transparent).
    // this will cause labels and controls to render on a white (logo) background.
    if (isBackgroundImageBrandLogo) {
      playerControlsBackgroundColor = playerControlsBackgroundColor || `transparent`;
      playerControlsIconColor = playerControlsIconColor || 'var(--primary-text-color, PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT)'
      playerHeaderBackgroundColor = playerHeaderBackgroundColor || `transparent`;
      playerHeaderTitle1Color = playerHeaderTitle1Color || 'var(--primary-text-color, PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT)'
      playerHeaderTitle2Color = playerHeaderTitle2Color || 'var(--primary-text-color, PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT)'
      playerHeaderTitle3Color = playerHeaderTitle3Color || 'var(--primary-text-color, PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT)'
      playerVolumeLabelColor = playerVolumeLabelColor || 'var(--primary-text-color, PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT)'
    }

    // build style info object.
    this.store.card.playerImage = backgroundImageUrl;
    if (playerControlsBackgroundColor)
      styleInfo['--stpc-player-controls-bg-color'] = `${playerControlsBackgroundColor} `;
    if (playerControlsColor)
      styleInfo['--stpc-player-controls-color'] = `${playerControlsColor}`;
    if (playerControlsIconToggleColor)
      styleInfo['--stpc-player-controls-icon-toggle-color'] = `${playerControlsIconToggleColor}`;
    if (playerControlsIconColor)
      styleInfo['--stpc-player-controls-icon-color'] = `${playerControlsIconColor}`;
    if (playerControlsIconSize)
      styleInfo['--stpc-player-controls-icon-size'] = `${playerControlsIconSize}`;
    styleInfo['--stpc-player-controls-icon-button-size'] = `var(--stpc-player-controls-icon-size, ${PLAYER_CONTROLS_ICON_SIZE_DEFAULT}) + 0.75rem`;
    if (playerHeaderBackgroundColor)
      styleInfo['--stpc-player-header-bg-color'] = `${playerHeaderBackgroundColor}`;
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
    if (playerMinimizedTitleColor)
      styleInfo['--stpc-player-minimized-title-color'] = `${playerMinimizedTitleColor}`;
    if (playerMinimizedTitleFontSize)
      styleInfo['--stpc-player-minimized-title-font-size'] = `${playerMinimizedTitleFontSize}`;
    if (playerProgressLabelColor)
      styleInfo['--stpc-player-progress-label-color'] = `${playerProgressLabelColor}`;
    if (playerProgressSliderColor)
      styleInfo['--stpc-player-progress-slider-color'] = `${playerProgressSliderColor}`;
    if (playerVolumeLabelColor)
      styleInfo['--stpc-player-volume-label-color'] = `${playerVolumeLabelColor}`;
    if (playerVolumeSliderColor)
      styleInfo['--stpc-player-volume-slider-color'] = `${playerVolumeSliderColor}`;

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


  
}
