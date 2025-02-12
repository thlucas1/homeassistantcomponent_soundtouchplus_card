// lovelace card imports.
import { css, html, LitElement, TemplateResult, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';

// our imports.
import { CardConfig } from '../types/card-config';
import { Store } from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { MediaPlayerState } from '../services/media-control-service';

class PlayerBody extends LitElement {

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

    const stopped = [MediaPlayerState.PLAYING, MediaPlayerState.PAUSED, MediaPlayerState.BUFFERING].includes(this.player.state) && nothing;

    // keep compiler happy.
    if (this.config) {
    }
    if (this.player) {
    }

    // *** NOTE - this section currently does not really do anything.  It was put here
    // in the event that we wanted to add actions relating to playing content.

    // render html.
    return html` 
      <div class="player-body-container" hide=${stopped} style=${this.styleContainer()}>
        <div class="flex-1"></div>
      </div>`;
  }


  /**
   * Returns an element style for the progress bar portion of the control.
   */
  private styleContainer() {
    return styleMap({
    });
  }


  /**
   * style definitions used by this component.
   * */
  static get styles() {
    return css`

      .player-body-container {
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

      *[hide] {
        display: none;
      }

      .flex-1 {
        flex: 1;
      }
    `;
  }
}


/**
 * Actions related to a playing track.
 */
export enum TrackActions {
  ArtistFavoriteAdd = "ArtistFavoriteAdd",
  AlbumFavoriteAdd = "AlbumFavoriteAdd",
  TrackFavoriteAdd = "TrackFavoriteAdd",
  ArtistFavoriteRemove = "ArtistFavoriteRemove",
  AlbumFavoriteRemove = "AlbumFavoriteRemove",
  TrackFavoriteRemove = "TrackFavoriteRemove",
}

customElements.define('stpc-player-body', PlayerBody);
