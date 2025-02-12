// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap, StyleInfo } from 'lit-html/directives/style-map.js';

// our imports.
import '../components/player-progress';
import { sharedStylesFavActions } from '../styles/shared-styles-fav-actions.js';
import { CardConfig } from '../types/card-config';
import { Store } from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { formatTitleInfo } from '../utils/media-browser-utils';

class PlayerHeader extends LitElement {

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

    // set common references from application common storage area.
    this.config = this.store.config;
    this.player = this.store.player;

    // get hide progress bar configuration setting.
    const hideProgress = this.config.playerHeaderHideProgressBar || false;

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.playerHeaderTitle, this.config, this.player);
    let artistTrack = formatTitleInfo(this.config.playerHeaderArtistTrack, this.config, this.player);
    let album = formatTitleInfo(this.config.playerHeaderAlbum, this.config, this.player);

    // just in case nothing is playing, get rid of any ' - ' sequences.
    if (artistTrack) {
      artistTrack = artistTrack.replace(/^ - | - $/g, '');
    }

    // if nothing is playing then display configured 'no media playing' text.
    if (!this.player.attributes.media_title) {
      artistTrack = formatTitleInfo(this.config.playerHeaderNoMediaPlayingText, this.config, this.player) || 'No Media Playing';
      album = undefined;
    }

    // render html.
    return html` 
      <div class="player-header-container" style=${this.styleContainer()}>
        ${!hideProgress ? html`<stpc-player-progress .store=${this.store}></stpc-player-progress>` : html``}
        ${title ? html`<div class="header-title">${title}</div>` : html``}
        ${artistTrack ? html`
          <div class="header-artist-track">${artistTrack}
          </div>
        ` : html``}
        ${album ? html`<div class="header-artist-album">${album}</div>` : html``}
      </div>`;
  }


  /**
   * Returns a style map for player header container.
   */
  private styleContainer() {

    // load card configuration theme settings.
    const playerHeaderTitle1Color = this.config.playerHeaderTitle1Color;
    const playerHeaderTitle1FontSize = this.config.playerHeaderTitle1FontSize;
    const playerHeaderTitle2Color = this.config.playerHeaderTitle2Color;
    const playerHeaderTitle2FontSize = this.config.playerHeaderTitle2FontSize;
    const playerHeaderTitle3Color = this.config.playerHeaderTitle3Color;
    const playerHeaderTitle3FontSize = this.config.playerHeaderTitle3FontSize;

    // build style info object.
    const styleInfo: StyleInfo = <StyleInfo>{};
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
    return styleMap(styleInfo);

  }


  /**
   * style definitions used by this component.
   * */
  static get styles() {
    return [
      sharedStylesFavActions,
      css`

      .player-header-container {
        margin: 0.75rem 3.25rem;
        margin-top: 0rem;
        padding: 0.5rem;
        padding-top: 0rem;
        max-width: 40rem;
        text-align: center;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
        /*border: 1px solid red;  /*  FOR TESTING CONTROL LAYOUT CHANGES */
      }

      .header-title {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: var(--stpc-player-header-title1-font-size, 1.0rem);
        line-height: var(--stpc-player-header-title1-font-size, 1.0rem);
        font-weight: 500;
        text-shadow: 0 0 2px var(--stpc-player-palette-vibrant);
        color: var(--stpc-player-header-title1-color, #ffffff);
        white-space: nowrap;
        mix-blend-mode: screen;
        min-height: 0.5rem;
        padding: 0.2rem;
      }

      .header-artist-track {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: var(--stpc-player-header-title2-font-size, 1.15rem);
        line-height: var(--stpc-player-header-title2-font-size, 1.15rem);
        font-weight: 400;
        text-shadow: 0 0 2px var(--stpc-player-palette-vibrant);
        color: var(--stpc-player-header-title2-color, #ffffff);
        mix-blend-mode: screen;
        padding: 0.1rem;
      }

      .header-artist-album {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: var(--stpc-player-header-title3-font-size, 1.0rem);
        line-height: var(--stpc-player-header-title3-font-size, 1.0rem);
        font-weight: 400;
        text-shadow: 0 0 2px var(--stpc-player-palette-vibrant);
        color: var(--stpc-player-header-title3-color, #ffffff);
        mix-blend-mode: screen;
        padding: 0.1rem;
      }
    `
    ];
  }
}

customElements.define('stpc-player-header', PlayerHeader);
