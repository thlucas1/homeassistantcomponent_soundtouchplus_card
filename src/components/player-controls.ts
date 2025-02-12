//// debug logging.
//import Debug from 'debug/src/browser.js';
//import { DEBUG_APP_NAME } from '../constants';
//const debuglog = Debug(DEBUG_APP_NAME + ":player-controls");

// lovelace card imports.
import { css, html, LitElement, TemplateResult, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import {
  mdiPause,
  mdiPlay,
  mdiPower,
  mdiRepeat,
  mdiRepeatOff,
  mdiRepeatOnce,
  mdiShuffle,
  mdiShuffleDisabled,
  mdiSkipNext,
  mdiSkipPrevious,
} from '@mdi/js';

// our imports.
import { CardConfig } from '../types/card-config';
import { Store } from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { MediaPlayerEntityFeature, MediaPlayerState, RepeatMode } from '../services/media-control-service';
import { MediaControlService } from '../services/media-control-service';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { ProgressEndedEvent } from '../events/progress-ended';
import { ProgressStartedEvent } from '../events/progress-started';
import { closestElement, getHomeAssistantErrorMessage, isCardInEditPreview } from '../utils/utils';
import { Player } from '../sections/player';
import { PLAYER_CONTROLS_ICON_TOGGLE_COLOR_DEFAULT } from '../constants';

const { NEXT_TRACK, PAUSE, PLAY, PREVIOUS_TRACK, REPEAT_SET, SHUFFLE_SET, TURN_OFF, TURN_ON } = MediaPlayerEntityFeature;


class PlayerControls extends LitElement {

  // public state properties.
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) mediaContentId!: string;

  /** Card configuration data. */
  private config!: CardConfig;

  /** MediaPlayer instance created from the configuration entity id. */
  private player!: MediaPlayer;

  /** MediaPlayer control service instance. */
  private mediaControlService!: MediaControlService;

  /** SpotifyPlus services instance. */
  protected soundTouchPlusService!: SoundTouchPlusService;

  /** True if the card is in edit preview mode (e.g. being edited); otherwise, false. */
  protected isCardInEditPreview!: boolean;


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // set common references from application common storage area.
    this.config = this.store.config;
    this.player = this.store.player;
    this.mediaControlService = this.store.mediaControlService;
    this.soundTouchPlusService = this.store.soundTouchPlusService;

    const stopped = [MediaPlayerState.ON, MediaPlayerState.PLAYING, MediaPlayerState.PAUSED, MediaPlayerState.BUFFERING].includes(this.player.state) && nothing;
    const idle = [MediaPlayerState.IDLE].includes(this.player.state) && nothing;

    // set button color based on selected option.
    const colorRepeat = [RepeatMode.ONE, RepeatMode.ALL].includes(this.player.attributes.repeat || RepeatMode.OFF);
    const colorShuffle = (this.player.attributes.shuffle);
    const colorPlay = (this.player.state == MediaPlayerState.PAUSED);
    const colorPower = (this.player.state == MediaPlayerState.OFF);

    // render html.
    // note that the "TURN_ON" feature will only be displayed if the player is off AND if
    // the device supports the TURN_ON feature.
    return html`
      <div class="player-controls-container" style=${this.styleContainer()}>
          <div class="icons" hide=${stopped}>
              <div class="flex-1"></div>
              <ha-icon-button @click=${() => this.onClickAction(SHUFFLE_SET)}    hide=${this.hideFeature(SHUFFLE_SET)}    .path=${this.getShuffleIcon()} label="Shuffle" style=${this.styleIcon(colorShuffle)}></ha-icon-button>
              <ha-icon-button @click=${() => this.onClickAction(PREVIOUS_TRACK)} hide=${this.hideFeature(PREVIOUS_TRACK)} .path=${mdiSkipPrevious} label="Previous Track"></ha-icon-button>
              <ha-icon-button @click=${() => this.onClickAction(PLAY)}           hide=${this.hideFeature(PLAY)}           .path=${mdiPlay} label="Play" style=${this.styleIcon(colorPlay)}></ha-icon-button>
              <ha-icon-button @click=${() => this.onClickAction(PAUSE)}          hide=${this.hideFeature(PAUSE)}          .path=${mdiPause} label="Pause"></ha-icon-button>
              <ha-icon-button @click=${() => this.onClickAction(NEXT_TRACK)}     hide=${this.hideFeature(NEXT_TRACK)}     .path=${mdiSkipNext} label="Next Track"></ha-icon-button>
              <ha-icon-button @click=${() => this.onClickAction(REPEAT_SET)}     hide=${this.hideFeature(REPEAT_SET)}     .path=${this.getRepeatIcon()} label="Repeat" style=${this.styleIcon(colorRepeat)} ></ha-icon-button>
          </div>
          <div class="iconsPower" hide=${idle}>
              <ha-icon-button @click=${() => this.onClickAction(PLAY)}           hide=${this.hideFeature(PLAY)}           .path=${mdiPlay} label="Play" style=${this.styleIcon(true)}></ha-icon-button>
          </div>
          <stpc-player-volume hide=${stopped} .store=${this.store} .player=${this.player} class="player-volume-container"></stpc-player-volume>
          <div class="iconsPower">
              <ha-icon-button @click=${() => this.onClickAction(TURN_ON)}        hide=${this.hideFeature(TURN_ON)}        .path=${mdiPower} label="Turn On" style=${this.styleIcon(colorPower)}></ha-icon-button>
              <ha-icon-button @click=${() => this.onClickAction(TURN_OFF)}       hide=${this.hideFeature(TURN_OFF)}       .path=${mdiPower} label="Turn Off"></ha-icon-button>
          </div>
      </div>
  `;
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
        /*border: 1px solid red;  /*  FOR TESTING CONTROL LAYOUT CHANGES */
      }

      .player-volume-container {
        display: block;
      }

      .icons {
        justify-content: center;
        display: inline-flex;
        align-items: center;
        overflow: hidden;
        color: var(--stpc-player-controls-icon-color, #ffffff);
        --mdc-icon-button-size: var(--stpc-player-controls-icon-button-size, 2.75rem);
        --mdc-icon-size: var(--stpc-player-controls-icon-size, 2.0rem);
        text-shadow: 0 0 2px var(--stpc-player-palette-vibrant);
        mix-blend-mode: screen;
      }

      .iconsPower {
        justify-content: center;
        display: block;
        align-items: center;
        overflow: hidden;
        color: var(--stpc-player-controls-icon-color, #ffffff);
        --mdc-icon-button-size: var(--stpc-player-controls-icon-button-size, 3.25rem);
        --mdc-icon-size: var(--stpc-player-controls-icon-size, 2.5rem);
      }

      *[hide] {
        display: none;
      }

      .flex-1 {
        flex: 1;
      }
    `;
  }

  /**
   * Invoked when the component is added to the document's DOM.
   *
   * In `connectedCallback()` you should setup tasks that should only occur when
   * the element is connected to the document. The most common of these is
   * adding event listeners to nodes external to the element, like a keydown
   * event handler added to the window.
   */
  public connectedCallback() {

    // invoke base class method.
    super.connectedCallback();

    // determine if card configuration is being edited.
    this.isCardInEditPreview = isCardInEditPreview(this.store.card);

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

    // invoke base class method.
    super.disconnectedCallback();
  }


  /**
   * Handles the `click` event fired when a control icon is clicked.
   * 
   * @param action Action to execute.
   */
  private async onClickAction(action: any): Promise<boolean> {

    try {

      // show progress indicator.
      this.progressShow();

      // call async service based on requested action.
      if (action == PAUSE) {

        await this.mediaControlService.media_pause(this.player);

      } else if (action == PLAY) {

        await this.mediaControlService.media_play(this.player);

      } else if (action == NEXT_TRACK) {

        await this.mediaControlService.media_next_track(this.player);

      } else if (action == PREVIOUS_TRACK) {

        // the following is the same formula used in Progress class (trackProgress method).
        // get current track positioning from media player attributes.
        const position = this.player?.attributes.media_position || 0;
        const playing = this.player?.isPlaying();
        const updatedAt = this.player?.attributes.media_position_updated_at || 0;
        let playingProgress = position;

        // calculate progress.
        if (playing) {
          playingProgress = position + (Date.now() - new Date(updatedAt).getTime()) / 1000.0;
        }

        // if more than 8 seconds have passed then just restart the track;
        // otherwise, select the previous track.
        if (playingProgress > 8) {
          await this.mediaControlService.media_seek(this.player, 0);
        } else {
          await this.mediaControlService.media_previous_track(this.player);
        }

      } else if (action == REPEAT_SET) {

        let repeat_mode = RepeatMode.OFF;
        if (this.player.attributes.repeat == RepeatMode.OFF) {
          repeat_mode = RepeatMode.ONE;
        } else if (this.player.attributes.repeat == RepeatMode.ONE) {
          repeat_mode = RepeatMode.ALL;
        } else if (this.player.attributes.repeat == RepeatMode.ALL) {
          repeat_mode = RepeatMode.OFF;
        }
        await this.mediaControlService.repeat_set(this.player, repeat_mode);

      } else if (action == SHUFFLE_SET) {

        await this.mediaControlService.shuffle_set(this.player, !this.player.attributes.shuffle);

      } else if (action == TURN_OFF) {

        await this.soundTouchPlusService.turn_off(this.player);

      } else if (action == TURN_ON) {

        await this.soundTouchPlusService.turn_on(this.player);

      }

      this.progressHide();
      return true;

    }
    catch (error) {

      // set alert error message.
      this.alertErrorSet("Control action failed: " + getHomeAssistantErrorMessage(error));
      this.progressHide();
      return true;

    }
    finally {
    }

  }


  /**
   * Returns `nothing` if the specified feature is to be SHOWN; otherwise, any
   * other value will cause the feature icon to be hidden (weird logic, I know).
   * 
   * The feature will be hidden from view if the media player does not support it,
   * or if the configuration settings "playerControlsHideX" is true.
   * 
   * @param feature Feature identifier to check.
   */
  private hideFeature(feature: any) {

    if (feature == PAUSE) {

      if (this.player.supportsFeature(PAUSE)) {
        // if already paused, then hide it!
        if (this.player.state == MediaPlayerState.PAUSED) {
          return;
        }
        return this.config.playerControlsHidePlayPause || nothing;
      }

    } else if (feature == PLAY) {

      if (this.player.supportsFeature(PLAY)) {
        // if already playing, then hide it!
        if (this.player.state == MediaPlayerState.PLAYING) {
          return;
        }
        return this.config.playerControlsHidePlayPause || nothing;
      }

    } else if (feature == NEXT_TRACK) {

      if (this.player.supportsFeature(NEXT_TRACK))
        return this.config.playerControlsHideTrackNext || nothing;

    } else if (feature == PREVIOUS_TRACK) {

      if (this.player.supportsFeature(PREVIOUS_TRACK))
        return this.config.playerControlsHideTrackPrev || nothing;

    } else if (feature == REPEAT_SET) {

      if (this.player.supportsFeature(REPEAT_SET))
        return this.config.playerControlsHideRepeat || nothing;

    } else if (feature == SHUFFLE_SET) {

      if (this.player.supportsFeature(SHUFFLE_SET))
        return this.config.playerControlsHideShuffle || nothing;

    } else if (feature == TURN_ON) {

      if (this.player.supportsFeature(TURN_ON)) {
        if ([MediaPlayerState.OFF, MediaPlayerState.STANDBY].includes(this.player.state)) {
          return (this.config.playerVolumeControlsHidePower) ? true : nothing;
        }
        return true; // hide icon
      }

    } else if (feature == TURN_OFF) {

      // this should only be allowed if the player state is IDLE.
      if (this.player.supportsFeature(TURN_OFF)) {
        if ([MediaPlayerState.IDLE].includes(this.player.state)) {
          return (this.config.playerVolumeControlsHidePower) ? true : nothing;
        }
        return true; // hide icon
      }

    }

    // default is to hide the feature.
    return true;

  }


  /**
   * Hide visual progress indicator.
   */
  private progressHide(): void {
    this.store.card.dispatchEvent(ProgressEndedEvent());
  }


  /**
   * Show visual progress indicator.
   */
  private progressShow(): void {
    this.store.card.dispatchEvent(ProgressStartedEvent());
  }


  ///**
  // * Sets the alert info message in the parent player.
  // */
  //private alertInfoSet(message: string): void {

  //  // find the parent player reference, and update the message.
  //  // we have to do it this way due to the shadowDOM between this 
  //  // element and the player element.
  //  const spcPlayer = closestElement('#spcPlayer', this) as Player;
  //  if (spcPlayer) {
  //    spcPlayer.alertInfoSet(message);
  //  }

  //}


  /**
   * Sets the alert error message in the parent player.
   */
  private alertErrorSet(message: string): void {

    // find the parent player reference, and update the message.
    // we have to do it this way due to the shadowDOM between this 
    // element and the player element.
    const spcPlayer = closestElement('#spcPlayer', this) as Player;
    if (spcPlayer) {
      spcPlayer.alertErrorSet(message);
    }

  }


  /**
   * Returns the icon to display for the repeat button.
   */
  private getRepeatIcon() {

    if (this.player.attributes.repeat == RepeatMode.ALL) {
      return mdiRepeat;
    } else if (this.player.attributes.repeat == RepeatMode.ONE) {
      return mdiRepeatOnce;
    } else {
      return mdiRepeatOff;
    }

  }


  /**
   * Returns the icon to display for the shuffle button.
   */
  private getShuffleIcon() {

    if (this.player.attributes.shuffle) {
      return mdiShuffle;
    } else {
      return mdiShuffleDisabled;
    }

  }


  /**
   * Returns an element style for the progress bar portion of the control.
   */
  private styleContainer() {
    return styleMap({
      'margin-bottom': '0px;',  // cannot place this in class (player-controls-container), must be placed here!
    });
  }


  /**
   * Returns an element style for control icon coloring.
   * 
   * @param isToggled True if the icon is in a toggle state; otherwise false if icon is in a non-toggled state.
   */
  private styleIcon(isToggled: boolean | undefined): string | undefined {

    // if button is toggled, then use the icon toggle color; 
    // otherwise, default to regular icon color.
    if (isToggled) {
      return `color: var(--stpc-player-controls-icon-toggle-color, ${PLAYER_CONTROLS_ICON_TOGGLE_COLOR_DEFAULT});`;
    }
    return undefined;
  }

}

customElements.define('stpc-player-controls', PlayerControls);
