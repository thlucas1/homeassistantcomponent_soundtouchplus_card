// lovelace card imports.
import { css, html, LitElement, TemplateResult, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiVolumeHigh, mdiVolumeMute } from '@mdi/js';

// our imports.
import { CardConfig } from '../types/cardconfig';
import { Store } from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { MediaPlayerEntityFeature } from '../types/mediaplayer-entityfeature'
import { MediaControlService } from '../services/media-control-service';

const { TURN_OFF, TURN_ON } = MediaPlayerEntityFeature;

class Volume extends LitElement {

  /** Application common storage area. */
  @property({ attribute: false }) store!: Store;

  /** MediaPlayer instance created from the configuration entity id. */
  @property({ attribute: false }) player!: MediaPlayer;

  /** Card configuration data. */
  private config!: CardConfig;

  /** MediaControlService services helper instance. */
  private mediaControlService!: MediaControlService;

  @property() slim: boolean = false;

  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // set common references from application common storage area.
    this.config = this.store.config;
    this.mediaControlService = this.store.mediaControlService;

    // get volume hide configuration setting.
    const hideMute = this.config.playerVolumeControlsHideMute || false;
    const muteIcon = this.player.isMuted() ? mdiVolumeMute : mdiVolumeHigh;

    // get current and max volume levels.
    const volume = this.player.getVolume();
    const maxVolume = 100; // this.getMaxVolume(volume);

    // render control.
    return html`
      <div class="volume-container" slim=${this.slim || nothing}>
        ${!hideMute ? html`<ha-icon-button @click=${this.OnMuteClick} .path=${muteIcon}></ha-icon-button>` : html``}
        <div class="volume-slider" style=${this.styleVolumeSlider()}>
          <ha-control-slider
            .value=${volume}
            max=${maxVolume}
            @value-changed=${this.OnVolumeValueChanged}
          ></ha-control-slider>
          <div class="volume-level">
            <div style="flex: ${volume};text-align: left">0%</div>
            <div class="volume-percentage">${Math.round(volume)}%</div>
            <div style="flex: ${maxVolume - volume};text-align: right">${maxVolume}%</div>
          </div>
        </div>
        <stpc-ha-player .store=${this.store} .features=${this.showPower()}></stpc-ha-player>
      </div>
    `;
  }


  //private getMaxVolume(volume: number) {
  //  const dynamicThreshold = Math.max(0, Math.min(this.config.dynamicVolumeSliderThreshold ?? 20, 100));
  //  const dynamicMax = Math.max(0, Math.min(this.config.dynamicVolumeSliderMax ?? 30, 100));
  //  return volume < dynamicThreshold && this.config.dynamicVolumeSlider ? dynamicMax : 100;
  //}


  /**
   * Handles the `value-changed` event fired when the volume slider is changed.
   * 
   * @param args Event arguments.
   */
  private async OnVolumeValueChanged(args: Event) {
    const newVolume = Number.parseInt((args?.target as HTMLInputElement)?.value);
    return await this.mediaControlService.volumeSet(this.player, newVolume);
  }


  /**
   * Handles the `click` event fired when the mute button is clicked.
   */
  private async OnMuteClick() {
    return await this.mediaControlService.volumeMuteToggle(this.player);
  }


  /**
   * Returns the media player features to be displayed if TURN_OFF, TURN_ON feature is enabled.
   */
  private showPower() {

    // media player does not support power (TURN_ON, TURN_OFF) features.
    if (!this.player.supportsTurnOn()) {
      return [];
    }

    // user enabled / disabled power control in configuration.
    return this.config.playerVolumeControlsHidePower ? [] : [TURN_OFF, TURN_ON];
  }


  /**
   * Returns an element style for the volume slider portion of the control.
   */
  private styleVolumeSlider(): string | undefined {

    // show / hide the header.
    const hideSlider = this.config.playerVolumeControlsHideSlider || false;
    if (hideSlider)
      return `display: none`;

    return
  }


  /**
   * style definitions used by this component.
   * */
  static get styles() {
    return css`
      ha-control-slider {
        --control-slider-color: var(--dark-primary-color);
        --control-slider-thickness: 1rem;
      }

      ha-control-slider[disabled] {
        --control-slider-color: var(--disabled-text-color);
        --control-slider-thickness: 1rem;
      }

      .volume-container {
        display: flex;
        flex: 1;
        justify-content: space-between;
        mix-blend-mode: screen;
      }

      .volume-slider {
        flex: 1;
        padding-right: 0.0rem;
        align-content: flex-end;
      }

      .volume-level {
        font-size: x-small;
        display: flex;
      }

      .volume-percentage {
        flex: 2;
        font-weight: bold;
        font-size: 12px;
      }

      *[slim] * {
        --control-slider-thickness: 10px;
        --mdc-icon-button-size: 30px;
        --mdc-icon-size: 20px;
      }

      *[slim] .volume-level {
        display: none;
      }

      *[slim] .volume-slider {
        display: flex;
        align-items: center;
      }
    `;
  }
}


customElements.define('stpc-player-volume', Volume);
