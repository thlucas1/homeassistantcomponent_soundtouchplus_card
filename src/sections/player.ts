// lovelace card imports.
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

// our imports.
import { Store } from '../model/store';
import { CardConfig } from '../types/cardconfig'
import { MUSIC_NOTES_BASE64_IMAGE, TV_BASE64_IMAGE } from '../constants';
import { MediaPlayer } from '../model/media-player';

export class Player extends LitElement {

  @property({ attribute: false }) store!: Store;

  private config!: CardConfig;
  private player!: MediaPlayer;

  render() {

    this.config = this.store.config;
    this.player = this.store.player;

    return html`
      <div class="container" style=${this.getBackgroundImage()}>
        <div class="artwork" hide=${nothing} style=${this.artworkStyle()}></div>
      </div>
    `;
  }

  private artworkStyle() {
    return `${this.getBackgroundImage()}; min-height: 5rem`;
  }

  private getBackgroundImage() {
    const fallbackImage =
      this.config.fallbackArtwork ??
      (this.player.attributes.media_title === 'TV' ? TV_BASE64_IMAGE : MUSIC_NOTES_BASE64_IMAGE);
    const fallbackBackgroundUrl = `url(${fallbackImage})`;
    const image = this.getArtworkImage();
    if (image) {
      return `background-image: url(${image.entityImage}), ${fallbackBackgroundUrl}${
        image.sizePercentage ? `; background-size: ${image.sizePercentage}%` : ''
      }`;
    } else {
      return `background-image: ${fallbackBackgroundUrl}`;
    }
  }

  private getArtworkImage() {
    const prefix = '';
    const { entity_picture } = this.player.attributes;
    const entityImage = entity_picture ? prefix + entity_picture : entity_picture;
    const sizePercentage = undefined;
    return { entityImage, sizePercentage };
  }

  static get styles() {
    return css`
      .hoverable:focus,
      .hoverable:hover {
        color: var(--accent-color);
      }

      .hoverable:active {
        color: var(--primary-color);
      }

      .container {
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
        background-size: cover;
      }

      .header {
        grid-area: header;
        margin: 0.75rem 3.25rem;
        padding: 0.5rem;
      }

      .controls {
        grid-area: controls;
        overflow-y: auto;
        margin: 0.25rem;
        padding: 0.5rem;
      }

      .artwork {
        grid-area: artwork;
        align-self: center;
        flex-grow: 1;
        flex-shrink: 0;
        width: 100%;
        height: 100%;
        min-height: 5rem;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
      }

      *[hide] {
        display: none;
      }

      *[background] {
        background-color: rgba(var(--rgb-card-background-color), 0.9);
        border-radius: 10px;
      }
    `;
  }
}
