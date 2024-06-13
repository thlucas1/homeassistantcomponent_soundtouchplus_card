// lovelace card imports.
import { css, html, LitElement, TemplateResult, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';

// our imports.
import { CardConfig } from '../types/cardconfig';
import { Store } from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { MediaPlayerEntityFeature } from '../types/mediaplayer-entityfeature'
import { PLAYER_CONTROLS_BACKGROUND_OPACITY_DEFAULT } from '../constants'

const { NEXT_TRACK, PAUSE, PLAY, PREVIOUS_TRACK, REPEAT_SET, SHUFFLE_SET } = MediaPlayerEntityFeature;

class PlayerControls extends LitElement {

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

    this.config = this.store.config;
    this.player = this.store.player;

    //const stopped = ['paused', 'playing'].includes(this.player.state) && nothing;
    const stopped = ['on', 'idle', 'playing', 'paused', 'buffering'].includes(this.player.state) && nothing;
    
    // render html.
    // note that the "showPower" feature will only be displayed if the player is off AND if
    // the device supports the TURN_ON feature.
    return html`
      <div class="player-controls-container" style=${this.styleContainer()}>
          <div class="icons" hide=${stopped}>
              <div class="flex-1"></div>
              <stpc-ha-player .store=${this.store} .features=${this.showShuffle()}></stpc-ha-player>
              <stpc-ha-player .store=${this.store} .features=${this.showPrev()}></stpc-ha-player>
              <stpc-ha-player .store=${this.store} .features=${this.showPlayPause()}></stpc-ha-player>
              <stpc-ha-player .store=${this.store} .features=${this.showNext()}></stpc-ha-player>
              <stpc-ha-player .store=${this.store} .features=${this.showRepeat()}></stpc-ha-player>
          </div>
          <stpc-player-volume hide=${stopped} .store=${this.store} .player=${this.player}></stpc-player-volume>
          <div class="icons">
              <stpc-ha-player .store=${this.store} .features=${this.store.showMainPower()}></stpc-ha-player>
          </div">
      </div>
  `;
  }


  /**
   * Returns the media player features to be displayed if SHUFFLE_SET feature is enabled.
   */
  private showShuffle() {
    return this.config.playerControlsHideShuffle ? [] : [SHUFFLE_SET];
  }


  /**
   * Returns the media player features to be displayed if PREVIOUS_TRACK feature is enabled.
   */
  private showPrev() {
    return this.config.playerControlsHideTrackPrev ? [] : [PREVIOUS_TRACK];
  }


  /**
   * Returns the media player features to be displayed if PLAY, PAUSE feature is enabled.
   */
  private showPlayPause() {
    return this.config.playerControlsHidePlayPause ? [] : [PLAY, PAUSE];
  }


  /**
   * Returns the media player features to be displayed if NEXT_TRACK feature is enabled.
   */
  private showNext() {
    return this.config.playerControlsHideTrackNext ? [] : [NEXT_TRACK];
  }


  /**
   * Returns the media player features to be displayed if REPEAT_SET feature is enabled.
   */
  private showRepeat() {
    return this.config.playerControlsHideRepeat ? [] : [REPEAT_SET];
  }


  /**
   * Returns an element style for the progress bar portion of the control.
   */
  private styleContainer() {
    return styleMap({
      '--stpc-player-controls-container-background-opacity': `${this.config.playerControlsBackgroundOpacity || PLAYER_CONTROLS_BACKGROUND_OPACITY_DEFAULT}`
    });
  }


  /**
   * style definitions used by this component.
   * */
  static get styles() {
    return css`
      .player-controls-container {
        margin: 0.75rem 3.25rem;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        max-width: 40rem;
        text-align: center;
        overflow: hidden auto;
        border-radius: 10px;
        background-color: rgba(var(--rgb-card-background-color), var(--stpc-player-controls-container-background-opacity));
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
      }

      .icons {
        justify-content: center;
        display: inline-flex;
        align-items: center;
        --mdc-icon-button-size: 2.5rem !important;
        --mdc-icon-size: 1.5rem !important;
        mix-blend-mode: screen;
        overflow: hidden;
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

customElements.define('stpc-player-controls', PlayerControls);
