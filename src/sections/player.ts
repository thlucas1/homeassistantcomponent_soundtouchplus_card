// lovelace card imports.
import { css, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';

// ** IMPORTANT - Vibrant notes:
// ensure that you have "compilerOptions"."lib": [ ... , "WebWorker" ] specified
// in your tsconfig.json!  If not, the Vibrant module will not initialize correctly
// and you will tear your hair out trying to figure out why it doesn't work!!!
import Vibrant from 'node-vibrant/dist/vibrant';

// our imports.
import '../components/player-header';
import '../components/player-controls';
import '../components/player-volume';
import { CardConfig } from '../types/card-config';
import { Store } from '../model/store';
import { BRAND_LOGO_IMAGE_BASE64, BRAND_LOGO_IMAGE_SIZE } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { Palette } from '@vibrant/color';
import { isCardInEditPreview } from '../utils/utils';

/** default color value of the player header / controls background gradient. */
export const PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT = '#000000BB';


@customElement("stpc-player")
export class Player extends LitElement {

  /** Application common storage area. */
  @property({ attribute: false }) store!: Store;

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

    //console.log("render (player) - rendering control\n- mediaListLastUpdatedOn=%s");

    // set common references from application common storage area.
    this.config = this.store.config;
    this.player = this.store.player;

    // render html.
    return html`
      <div class="player-section-container" style=${this.styleBackgroundImage()}>
        <stpc-player-header style=${this.styleHeader()}
          class="player-section-header"
          .store=${this.store}
        ></stpc-player-header>
        <stpc-player-controls style=${this.styleControls()}
          class="player-section-controls"
          .store=${this.store}
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
          'artwork'
          'controls';
        min-height: 100%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: var(--stpc-player-background-size);
        text-align: -webkit-center;
      }

      .player-section-header {
        grid-area: header;
        margin: 0.0rem 0.0rem;
        padding: 0.0rem;
        background: linear-gradient(180deg, var(--stpc-player-header-bg-color) 30%, transparent 100%);
        background-repeat: no-repeat;
        /*border: 1px solid yellow;  /*  FOR TESTING CONTROL LAYOUT CHANGES */
      }

      .player-section-controls {
        grid-area: controls;
        margin: 0.0rem 0.0rem;
        padding: 0.0rem;
        overflow-y: auto;
        background: linear-gradient(0deg, var(--stpc-player-controls-bg-color) 30%, transparent 100%);
        background-repeat: no-repeat;
        /*border: 1px solid yellow;  /*  FOR TESTING CONTROL LAYOUT CHANGES */
      }
    `;
  }


  /**
   * Returns a background image style.
   */
  private styleBackgroundImage() {

    //console.log("styleBackgroundImage (player) - styling background image");

    // stretch the background cover art to fit the entire player.
    //const backgroundSize = 'cover';
    //const backgroundSize = 'contain';
    let backgroundSize = '100% 100%';
    if (this.config.width == 'fill') {
      // if in fill mode, then do not stretch the image.
      backgroundSize = 'contain';
    }
    
    // get various image source settings.
    const configImagePlayerBg = this.config.customImageUrls?.['playerBackground'];
    const configImagePlayerOffBg = this.config.customImageUrls?.['playerOffBackground'];
    const configImageDefault = this.config.customImageUrls?.['default'];

    // set header and controls section gradient background.
    let headerBackgroundColor = this.config.playerHeaderBackgroundColor || PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT;
    let controlsBackgroundColor = this.config.playerControlsBackgroundColor || PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT;

    // if player is off or unknown, then reset the playerImage value so that one
    // of the default images is selected below.
    if (this.player.isPoweredOffOrUnknown()) {
      //console.log("styleBackgroundImage (player) - using config.customImageUrls['playerOffBackground']")
      this.playerImage = undefined;
    }

    // set background image to display (first condition that is true):
    // - if customImageUrls `playerOffBackground` is configured AND player is off, then use it.
    // - if customImageUrls `playerBackground` is configured, then use it (static image).
    // - if media player entity_picture present, then use it (changes with each song).
    // - use static logo image (if none of the above).
    let imageUrl: string = '';
    if (configImagePlayerOffBg && this.player.isPoweredOffOrUnknown()) {
      //console.log("styleBackgroundImage (player) - using config.customImageUrls['playerOffBackground']")
      imageUrl = configImagePlayerOffBg;
    } else if (configImagePlayerBg) {
      //console.log("styleBackgroundImage (player) - using config.customImageUrls['playerBackground']")
      imageUrl = configImagePlayerBg;
    } else if (this.playerImage) {
      //console.log("styleBackgroundImage (player) - using this.playerImage")
      imageUrl = this.playerImage;
    } else {
      //console.log("styleBackgroundImage (player) - using resource image BRAND_LOGO_IMAGE_BASE64")
      imageUrl = configImageDefault || BRAND_LOGO_IMAGE_BASE64;
      headerBackgroundColor = 'transparent';
      controlsBackgroundColor = 'transparent';
      backgroundSize = BRAND_LOGO_IMAGE_SIZE;
    }

    //console.log("styleBackgroundImage (player) - resolved background image:\n%s",
    //  JSON.stringify(imageUrl),
    //);

    return styleMap({
      'background-image': `url(${imageUrl})`,
      '--stpc-player-background-size': `${backgroundSize}`,
      '--stpc-player-header-bg-color': `${headerBackgroundColor}`,
      '--stpc-player-header-color': `#ffffff`,
      '--stpc-player-controls-bg-color': `${controlsBackgroundColor}`,
      '--stpc-player-controls-color': `#ffffff`,
      '--stpc-player-palette-vibrant': `${this._colorPaletteVibrant}`,
      '--stpc-player-palette-muted': `${this._colorPaletteMuted}`,
      '--stpc-player-palette-darkvibrant': `${this._colorPaletteDarkVibrant}`,
      '--stpc-player-palette-darkmuted': `${this._colorPaletteDarkMuted}`,
      '--stpc-player-palette-lightvibrant': `${this._colorPaletteLightVibrant}`,
      '--stpc-player-palette-lightmuted': `${this._colorPaletteLightMuted}`,
    });
  }


  /**
   * Returns an element style for the header portion of the control.
   */
  private styleHeader(): string | undefined {

    // show / hide the header.
    const hideHeader = this.config.playerHeaderHide || false;
    if (hideHeader)
      return `display: none`;

    return
  }


  /**
   * Returns an element style for the header portion of the control.
   */
  private styleControls(): string | undefined {

    // show / hide the media controls.
    const hideControls = this.config.playerControlsHide || false;
    if (hideControls)
      return `display: none`;

    return
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

    //console.log("%c willUpdate (player) - changed property keys:\n",
    //  "color: gold;",
    //  JSON.stringify(changedPropKeys),
    //);

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
    if ((oldImage != newImage) && (!isCardInEditPreview(this.store.card))) {

      //console.log("%c willUpdate (player) - player image changed:\n- OLD IMAGE = %s\n- NEW IMAGE = %s",
      //  "color: gold;",
      //  JSON.stringify(oldImage),
      //  JSON.stringify(newImage),
      //);

      // extract the color differences from the new image and set the player colors.
      this._extractColors();

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

    //console.log("_extractColors (player) - extracting colors; playerImage:\n%s",
    //  JSON.stringify(this.playerImage || undefined),
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

      //console.log("_extractColors (player) 10\n- Vibrant Options:\n%s",
      //  JSON.stringify(vibrant.opts, null, 2),
      //);

      // get the color palettes for the player background image.
      await vibrant.getPalette().then(
        (palette: Palette) => {

          //console.log("_extractColors (player) 02 palette object:\n%s",
          //  JSON.stringify(palette,null,2),
          //);

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
        (reason: string) => {

          console.log("_extractColors (player) - Could not retrieve color palette info for player background image\nreason = %s",
            JSON.stringify(reason),
          );

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
