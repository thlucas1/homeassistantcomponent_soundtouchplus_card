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
import { PlayerBodyToneControls } from './player-body-tone-controls';

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

    // only need to do this if media is playing.
    if (this.player.isPlaying()) {

      // find body content element; this could be any of the following:
      // STPC-PLAYER-BODY-TONE-CONTROLS.
      const elmBody = this.parentElement?.querySelector(".player-section-body-content") as HTMLElement;
      if (elmBody) {

        const tagName = elmBody.tagName.toLowerCase();

        // if currently playing track info changed then gather various details
        // and update the player mediaContentId value so overlay content is updated on next render.
        if (tagName == ("stpc-player-body-tone-controls")) {
          const elmPlayerBodyToneControls = elmBody as PlayerBodyToneControls
          elmPlayerBodyToneControls.mediaContentId = this.player.attributes.media_content_id;
        }
      }
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

    // build style info object.
    const styleInfo: StyleInfo = <StyleInfo>{};
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
        margin-top: 0rem;
        padding: 0.5rem;
        padding-top: 0rem;
        padding-bottom: 0rem;
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
        mix-blend-mode: normal;
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
        mix-blend-mode: normal;
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
        mix-blend-mode: normal;
        padding: 0.1rem;
      }

      ///* when the user prefers dark theme mode */
      //@media (prefers-color-scheme: dark) {

      //  .header-title {
      //    color: var(--stpc-player-header-title1-color, #ffffff);
      //  }

      //  .header-artist-track {
      //    color: var(--stpc-player-header-title2-color, #ffffff);
      //  }

      //  .header-artist-album {
      //    color: var(--stpc-player-header-title3-color, #ffffff);
      //  }
      //}
    `
    ];
  }
}

customElements.define('stpc-player-header', PlayerHeader);
