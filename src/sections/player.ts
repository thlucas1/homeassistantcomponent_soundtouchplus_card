// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';

// our imports.
import '../components/player-header';
import '../components/player-controls';
import '../components/player-volume';
import { Store } from '../model/store';
import { CardConfig } from '../types/cardconfig'
import { MUSIC_NOTES_BASE64_IMAGE } from '../constants';
import { MediaPlayer } from '../model/media-player';

export class Player extends LitElement {

  /** Application common storage area. */
  @property({ attribute: false }) store!: Store;

  /** Card configuration data. */
  private config!: CardConfig;

  /** MediaPlayer instance created from the configuration entity id. */
  private player!: MediaPlayer;

  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    //console.log("player.render()\n Rendering player html");

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
      }

      .player-section-controls {
        grid-area: controls;
        margin: 0.0rem 0.0rem;
        padding: 0.0rem;
        overflow-y: auto;
      }
    `;
  }


  /**
   * Returns a background image style.
   */
  private styleBackgroundImage() {

    // stretch the background cover art to fit the entire player.
    //const backgroundSize = 'cover';
    //const backgroundSize = 'contain';
    let backgroundSize = '100% 100%';
    if (this.config.width == 'fill') {
      // if in fill mode, then do not stretch the image.
      backgroundSize = 'contain';
    }
    
    // get various image source settings.
    const playerImage = this.player.attributes.entity_picture;
    const configImagePlayerBg = this.config.customImageUrls?.['playerBackground'];
    const configImagePlayerOffBg = this.config.customImageUrls?.['playerOffBackground'];
    const configImageDefault = this.config.customImageUrls?.['default'];

    // use customImageUrls configuration player background image for the background image if found;
    // otherwise, use media player image if found;
    // otherwise, use customImageUrls configuration default image if found;
    // otherwise, use static music notes image.
    let imageUrl = '';
    if (configImagePlayerOffBg && this.player.isPoweredOff()) {
      imageUrl = configImagePlayerOffBg;
    } else if (configImagePlayerBg) {
      imageUrl = configImagePlayerBg;
    } else if (playerImage) {
      imageUrl = playerImage;
    } else {
      imageUrl = configImageDefault || MUSIC_NOTES_BASE64_IMAGE;
    }

    return styleMap({
      'background-image': `url(${imageUrl})`,
      '--stpc-player-background-size': `${backgroundSize}`,
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
}
