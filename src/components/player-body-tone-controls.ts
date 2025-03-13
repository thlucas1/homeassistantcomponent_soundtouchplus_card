// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":player-body-tone-controls");

// lovelace card imports.
import { css, html, TemplateResult, unsafeCSS } from 'lit';
import { state } from 'lit/decorators.js';

// our imports.
import { PLAYER_CONTROLS_ICON_TOGGLE_COLOR_DEFAULT } from '../constants';
import { sharedStylesGrid } from '../styles/shared-styles-grid.js';
import { sharedStylesMediaInfo } from '../styles/shared-styles-media-info.js';
import { sharedStylesFavActions } from '../styles/shared-styles-fav-actions.js';
import { getHomeAssistantErrorMessage } from '../utils/utils';
import { PlayerBodyBase } from './player-body-base';
import { MediaPlayer } from '../model/media-player';
import { IAudioDspControls } from '../types/soundtouchplus/audio-dsp-controls';
import { IAudioProductToneControls } from '../types/soundtouchplus/audio-product-tone-controls';
import { IBass } from '../types/soundtouchplus/bass';
import { IBassCapabilities } from '../types/soundtouchplus/bass-capabilities';
import { ISoundTouchDevice } from '../types/soundtouchplus/soundtouch-device';

/**
 * Track actions.
 */
enum Actions {
  GetAudioDspControls = "GetAudioDspControls",
  GetAudioProductToneControls = "GetAudioProductToneControls",
  GetBassCapabilities = "GetBassCapabilities",
  GetBassLevel = "GetBassLevel",
  SetAudioProductToneControls = "SetAudioProductToneControls",
}

// audio dsp controls AudioMode values.
const AUDIO_MODE_DIALOG = "AUDIO_MODE_DIALOG";
const AUDIO_MODE_NORMAL = "AUDIO_MODE_NORMAL";


export class PlayerBodyToneControls extends PlayerBodyBase {

  // private state properties.
  @state() private supportsAudioDspControls?: boolean;
  @state() private supportsAudioProductToneControls?: boolean;
  @state() private supportsBassCapabilities?: boolean;
  @state() private supportsBassLevel?: boolean;
  @state() private audioDspControls?: IAudioDspControls;
  @state() private audioProductToneControls?: IAudioProductToneControls;
  @state() private bassCapabilities?: IBassCapabilities;
  @state() private bassLevel?: IBass;

  /** SoundTouch device configuration. */
  private soundTouchDevice?: ISoundTouchDevice;


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // invoke base class method.
    super.render();

    // get supported device indicators.
    this.soundTouchDevice = this.store.card.soundTouchDevice;
    this.supportsBassCapabilities = this.soundTouchDevice?.supported_uris?.includes("bassCapabilities");
    this.supportsBassLevel = this.soundTouchDevice?.supported_uris?.includes("bass");
    this.supportsAudioDspControls = this.soundTouchDevice?.supported_uris?.includes("audiodspcontrols");
    this.supportsAudioProductToneControls = this.soundTouchDevice?.supported_uris?.includes("audioproducttonecontrols");

    // initialize common elements.
    const supportsToneControls = this.supportsBassLevel || this.supportsAudioProductToneControls || this.supportsBassCapabilities || false;

    // use the following formula to calculate value in range percentage:
    // value percentage = abs(100 * (currentValue - minValue) / (maxValue - minValue))

    // examples using a range of -100 to +100:
    // example 1:  abs(100 * (+50 - -100) / (+100 - -100)) = 75%
    // example 2:  abs(100 * (-75 - -100) / (+100 - -100)) = 12.5%

    // assign bass level values.
    const bassLevelStep = 1;
    const bassLevelMin = this.bassCapabilities?.minimum || -9;
    const bassLevelMax = this.bassCapabilities?.maximum || 0;
    const bassLevelValue = this.bassLevel?.actual || 0;
    const bassLevelValuePct = Math.abs(100 * ((bassLevelValue - bassLevelMin) / (bassLevelMax - bassLevelMin)));

    // assign audio dsp control values.
    //const audioDspControlsAudioMode = this.audioDspControls?.audio_mode || "AUDIO_MODE_NORMAL";

    // assign audio tone control values.
    const audioProductToneControlsBassStep = this.audioProductToneControls?.bass.step || 25;
    const audioProductToneControlsBassMin = this.audioProductToneControls?.bass.min_value || -100;
    const audioProductToneControlsBassMax = this.audioProductToneControls?.bass.max_value || +100;
    const audioProductToneControlsBassValue = this.audioProductToneControls?.bass.value || 0;
    const audioProductToneControlsBassValuePct = Math.abs(100 * ((audioProductToneControlsBassValue - audioProductToneControlsBassMin) / (audioProductToneControlsBassMax - audioProductToneControlsBassMin)));

    const audioProductToneControlsTrebleStep = this.audioProductToneControls?.treble.step || 25;
    const audioProductToneControlsTrebleMin = this.audioProductToneControls?.treble.min_value || -100;
    const audioProductToneControlsTrebleMax = this.audioProductToneControls?.treble.max_value || +100;
    const audioProductToneControlsTrebleValue = this.audioProductToneControls?.treble.value || 0;
    const audioProductToneControlsTrebleValuePct = Math.abs(100 * ((audioProductToneControlsTrebleValue - audioProductToneControlsTrebleMin) / (audioProductToneControlsTrebleMax - audioProductToneControlsTrebleMin)));

    // render html.
    return html` 
      <div class="player-body-container" hide=${this.isPlayerStopped}>
        <div class="player-body-container-scrollable">
          ${this.alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this.alertErrorClear}>${this.alertError}</ha-alert>` : ""}
          ${this.alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this.alertInfoClear}>${this.alertInfo}</ha-alert>` : ""}
          <div class="tone-controls-grid-container">
            <div class="media-info-text-ms-c">
              Device Tone Controls - ${this.soundTouchDevice?.device_name}
            </div>
            <div class="media-info-text-s">
              ${this.soundTouchDevice?.device_type}
            </div>
            ${!supportsToneControls ? html`
              <div class="media-info-text-ms-l tone-controls-grid-container">
                Device does not support tone controls
              </div>
            ` : html``}
            ${(this.supportsBassCapabilities && this.supportsBassLevel && (!this.supportsAudioProductToneControls)) ? html`
              <div class="media-info-text-s" style="padding-top: 1.0rem">
                Bass Reduction Settings
              </div>
              <div class="tone-slider">
                <ha-control-slider
                  .value=${bassLevelValue}
                  step=${bassLevelStep}
                  min=${bassLevelMin}
                  max=${bassLevelMax}
                  @value-changed=${this.onBassLevelValueChanged}
                ></ha-control-slider>
                <div class="tone-level">
                  <div class="tone-level-min">${bassLevelMin}</div>
                  <div class="tone-level-pct" style="flex: ${bassLevelValuePct}%;">${bassLevelValue}</div>
                  <div class="tone-level-max">${bassLevelMax}</div>
                </div>
            ` : html``}
            ${this.supportsAudioProductToneControls ? html`
              <div class="media-info-text-s" style="padding-top: 1.0rem">
                Bass Setting
              </div>
              <div class="tone-slider">
                <ha-control-slider
                  .value=${audioProductToneControlsBassValue}
                  step=${audioProductToneControlsBassStep}
                  min=${audioProductToneControlsBassMin}
                  max=${audioProductToneControlsBassMax}
                  @value-changed=${this.onAudioProductToneControlsBassChanged}
                ></ha-control-slider>
                <div class="tone-level">
                  <div class="tone-level-min">${audioProductToneControlsBassMin}</div>
                  <div class="tone-level-pct" style="flex: ${audioProductToneControlsBassValuePct}%;">${audioProductToneControlsBassValue}</div>
                  <div class="tone-level-max">${audioProductToneControlsBassMax}</div>
                </div>
              </div>
              <div class="media-info-text-s">
                Treble Setting
              </div>
              <div class="tone-slider">
                <ha-control-slider
                  .value=${audioProductToneControlsTrebleValue}
                  step=${audioProductToneControlsTrebleStep}
                  min=${audioProductToneControlsTrebleMin}
                  max=${audioProductToneControlsTrebleMax}
                  @value-changed=${this.onAudioProductToneControlsTrebleChanged}
                ></ha-control-slider>
                <div class="tone-level">
                  <div class="tone-level-min">${audioProductToneControlsTrebleMin}</div>
                  <div class="tone-level-pct" style="flex: ${audioProductToneControlsTrebleValuePct}%;">${audioProductToneControlsTrebleValue}</div>
                  <div class="tone-level-max">${audioProductToneControlsTrebleMax}</div>
                </div>
              </div>
            ` : html``}
            ${(this.supportsAudioProductToneControls && this.supportsAudioDspControls) ? html`
              <div class="media-info-text-s" style="display: flex;">
                <div style="flex:10%; text-align:left;">
                  Dialog Mode
                </div>
                <div style="flex:40%; text-align:left;">
                  <ha-switch
                    .name="Dialog Mode? (ha-switch)"
                    .checked=${this.audioDspControls?.audio_mode === AUDIO_MODE_DIALOG}
                    @change=${this.onAudioDspControlsAudioModeChanged}
                  ></ha-switch>
                </div>
              </div>
            ` : html``}
          </div>
        </div>
      </div>`;
  }


  /**
   * style definitions used by this component.
   * */
  static get styles() {
    return [
      sharedStylesGrid,
      sharedStylesMediaInfo,
      sharedStylesFavActions,
      css`

        /* style grid container */
        .tone-controls-grid-container {
          margin: 0.25rem;
        }

        ha-switch {
          margin-right: 1rem;
          vertical-align: text-bottom;
        }

        ha-control-slider {
          --control-slider-color: var(--stpc-player-tone-slider-color, var(--stpc-player-controls-color, var(--dark-primary-color, ${unsafeCSS(PLAYER_CONTROLS_ICON_TOGGLE_COLOR_DEFAULT)})));
          --control-slider-thickness: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.10);
          box-sizing: border-box;
        }

        ha-control-slider[disabled] {
          --control-slider-color: var(--disabled-text-color);
          --control-slider-thickness: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.10);
          box-sizing: border-box;
        }

        .tone-container {
          flex: 1;
          /*border: 1px solid blue;  /*  FOR TESTING CONTROL LAYOUT CHANGES */
        }

        .tone-boolean {
          padding-right: 0.0rem;
          align-content: flex-end;
          margin: 1.0rem;
        }

        .tone-slider {
          flex: 1;
          padding-right: 0.0rem;
          align-content: flex-end;
          color: var(--stpc-player-tone-label-color, var(--stpc-player-controls-color, #ffffff));
          margin: 1.0rem;
        }

        .tone-level {
          font-size: x-small;
          display: flex;
        }

        .tone-level-min {
          flex: 0;
          text-align: left;
          margin-right: 4px;
        }

        .tone-level-pct {
          text-align: right;
          font-weight: normal;
          font-size: 10px;
          color: var(--stpc-player-tone-slider-color, var(--stpc-player-controls-color, var(--dark-primary-color, ${unsafeCSS(PLAYER_CONTROLS_ICON_TOGGLE_COLOR_DEFAULT)})));
        }

        .tone-level-max {
          flex: 100;
          text-align: right;
          margin-left: 4px;
        }

        *[slim] * {
          --control-slider-thickness: 10px;
          --mdc-icon-button-size: 30px;
          --mdc-icon-size: 20px;
        }

        *[slim] .tone-level {
          display: none;
        }

        *[slim] .tone-slider {
          display: flex;
          align-items: center;
        }
      `
    ];
  }


  /**
   * Handles the `value-changed` event fired when the AudioDspControlsAudioMode is changed.
   * 
   * @param args Event arguments.
   */
  private async onAudioDspControlsAudioModeChanged(args: Event) {

    try {

      try {
        debuglog("%conAudioDspControlsAudioModeChanged - updating dsp controls; args.target.checked: \n%s",
          "color:gold",
          JSON.stringify((args?.target as HTMLInputElement)?.checked),
        );
      }
      catch(error) {
        // ignore debug errors.
      }

      // show progress indicator.
      this.progressShow();

      // get new values to apply.
      const isChecked = (args?.target as HTMLInputElement)?.checked
      const audioMode = isChecked ? AUDIO_MODE_DIALOG : AUDIO_MODE_NORMAL;

      // adjust the audio mode.
      await this.soundTouchPlusService.SetAudioDspControls(this.player, audioMode);

      // assign the new levels.
      if (this.audioDspControls) {
        this.audioDspControls.audio_mode = audioMode;
      }

      return true;

    }
    catch (error) {

      // set alert error message.
      this.alertErrorSet("Set AudioProductToneControls Treble failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {

      // hide progress indicator.
      this.progressHide();

    }

  }


  /**
   * Handles the `value-changed` event fired when the AudioProductToneControls Bass slider is changed.
   * 
   * @param args Event arguments.
   */
  private async onAudioProductToneControlsBassChanged(args: Event) {

    try {

      // show progress indicator.
      this.progressShow();

      // get new values to apply.
      const bassLevel = Number.parseInt((args?.target as HTMLInputElement)?.value);
      const trebleLevel = this.audioProductToneControls?.treble?.value; 

      // adjust the tone.
      await this.soundTouchPlusService.SetAudioProductToneControls(this.player, bassLevel, trebleLevel);

      // assign the new levels.
      if (this.audioProductToneControls) {
        this.audioProductToneControls.bass.value = bassLevel;
        this.audioProductToneControls.treble.value = trebleLevel;
      }

      return true;

    }
    catch (error) {

      // set alert error message.
      this.alertErrorSet("Set AudioProductToneControls Bass failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {

      // hide progress indicator.
      this.progressHide();

    }

  }


  /**
   * Handles the `value-changed` event fired when the AudioProductToneControls Treble slider is changed.
   * 
   * @param args Event arguments.
   */
  private async onAudioProductToneControlsTrebleChanged(args: Event) {

    try {

      // show progress indicator.
      this.progressShow();

      // get new values to apply.
      const bassLevel = this.audioProductToneControls?.bass?.value;
      const trebleLevel = Number.parseInt((args?.target as HTMLInputElement)?.value);

      // adjust the tone.
      await this.soundTouchPlusService.SetAudioProductToneControls(this.player, bassLevel, trebleLevel);

      // assign the new levels.
      if (this.audioProductToneControls) {
        this.audioProductToneControls.bass.value = bassLevel;
        this.audioProductToneControls.treble.value = trebleLevel;
      }

      return true;

    }
    catch (error) {

      // set alert error message.
      this.alertErrorSet("Set AudioProductToneControls Treble failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {

      // hide progress indicator.
      this.progressHide();

    }

  }


  /**
   * Handles the `value-changed` event fired when the BassCapabilities slider is changed.
   * 
   * @param args Event arguments.
   */
  private async onBassLevelValueChanged(args: Event) {

    try {

      // show progress indicator.
      this.progressShow();

      // get new value to apply.
      const level = Number.parseInt((args?.target as HTMLInputElement)?.value);

      // adjust the level.
      await this.soundTouchPlusService.SetBassLevel(this.player, level);

      // assign the new level.
      if (this.bassLevel) {
        this.bassLevel.actual = level;
      }

      return true;

    }
    catch (error) {

      // set alert error message.
      this.alertErrorSet("Set Bass Level failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {

      // hide progress indicator.
      this.progressHide();

    }

  }


  /**
   * Refreshes the tone control settings.  This function can be called when the body popup 
   * display is initially opened.
   * 
   * @param action Action to execute.
   * @param item Action arguments.
   */
  public refreshToneControls(): void {

    this.updateActions(this.player, []);

  }


  /**
   * Updates body actions.
   * 
   * @param player Media player instance that will process the update.
   * @param updateActions List of actions that need to be updated, or an empty list to update DEFAULT actions.
   * @returns True if actions update should continue after calling base class method; otherwise, False to abort actions update.
   */
  protected override updateActions(
    player: MediaPlayer,
    updateActions: any[],
  ): boolean {

    // invoke base class method; if it returns false, then we should not update actions.
    if (!super.updateActions(player, updateActions)) {
      return false;
    }

    try {

      const promiseRequests = new Array<Promise<unknown>>();

      debuglog("%cupdateActions - updating actions:\n- supportsAudioProductToneControls = %s\n- supportsBassCapabilities = %s\n- supportsBassLevel = %s",
        "color:gold",
        JSON.stringify(this.supportsAudioProductToneControls),
        JSON.stringify(this.supportsBassCapabilities),
        JSON.stringify(this.supportsBassLevel),
      );

      // was this action chosen to be updated?
      if ((updateActions.indexOf(Actions.GetAudioDspControls) != -1) || (updateActions.length == 0)) {

        // does the device support this capability?
        if (this.supportsAudioDspControls) {

          // create promise for action.
          const promiseGetAudioDspControls = new Promise((resolve, reject) => {

            // call service to retrieve audio dsp controls.
            this.soundTouchPlusService.GetAudioDspControls(player, true)
              .then(result => {

                // load results, and resolve the promise.
                this.audioDspControls = result;
                resolve(true);

              })
              .catch(error => {

                // clear results, and reject the promise.
                this.audioDspControls = undefined;
                this.alertErrorSet("Get Audio DSP Controls call failed: " + getHomeAssistantErrorMessage(error));
                reject(error);

              })
          });

          promiseRequests.push(promiseGetAudioDspControls);
        }
      }

      // was this action chosen to be updated?
      if ((updateActions.indexOf(Actions.GetAudioProductToneControls) != -1) || (updateActions.length == 0)) {

        // does the device support this capability?
        if (this.supportsAudioProductToneControls) {

          // create promise for action.
          const promiseGetAudioProductToneControls = new Promise((resolve, reject) => {

            // call service to retrieve audio product tone controls.
            this.soundTouchPlusService.GetAudioProductToneControls(player, true)
              .then(result => {

                // load results, and resolve the promise.
                this.audioProductToneControls = result;
                resolve(true);

              })
              .catch(error => {

                // clear results, and reject the promise.
                this.audioProductToneControls = undefined;
                this.alertErrorSet("Get Audio Product Tone Controls call failed: " + getHomeAssistantErrorMessage(error));
                reject(error);

              })
          });

          promiseRequests.push(promiseGetAudioProductToneControls);
        }
      }

      // was this action chosen to be updated?
      if ((updateActions.indexOf(Actions.GetBassCapabilities) != -1) || (updateActions.length == 0)) {

        // does the device support this capability?
        if (this.supportsBassCapabilities) {

          // create promise for action.
          const promiseGetBassCapabilities = new Promise((resolve, reject) => {

            // call service to retrieve bass capabilities.
            this.soundTouchPlusService.GetBassCapabilities(player, true)
              .then(result => {

                // load results, and resolve the promise.
                this.bassCapabilities = result;
                resolve(true);

              })
              .catch(error => {

                // clear results, and reject the promise.
                this.bassCapabilities = undefined;
                this.alertErrorSet("Get Bass Capabilities call failed: " + getHomeAssistantErrorMessage(error));
                reject(error);

              })
          });

          promiseRequests.push(promiseGetBassCapabilities);
        }
      }

      // was this action chosen to be updated?
      if ((updateActions.indexOf(Actions.GetBassLevel) != -1) || (updateActions.length == 0)) {

        // does the device support this capability?
        if (this.supportsBassLevel) {

          // create promise for action.
          const promiseGetBassLevel = new Promise((resolve, reject) => {

            // call service to retrieve bass level.
            this.soundTouchPlusService.GetBassLevel(player, true)
              .then(result => {

                // load results, and resolve the promise.
                this.bassLevel = result;
                resolve(true);

              })
              .catch(error => {

                // clear results, and reject the promise.
                this.bassLevel = undefined;
                this.alertErrorSet("Get Bass Level call failed: " + getHomeAssistantErrorMessage(error));
                reject(error);

              })
          });

          promiseRequests.push(promiseGetBassLevel);
        }
      }

      // show visual progress indicator.
      this.progressShow();

      // execute all promises, and wait for all of them to settle.
      // we use `finally` logic so we can clear the progress indicator.
      // any exceptions raised should have already been handled in the 
      // individual promise definitions; nothing else to do at this point.
      Promise.allSettled(promiseRequests).finally(() => {

        // clear the progress indicator.
        this.progressHide();

        // call base class method for post actions update processing.
        this.updateActionsComplete(updateActions);

      });
      return true;

    }
    catch (error) {

      // clear the progress indicator and set alert error message.
      this.progressHide();
      this.alertErrorSet("Device Tone Controls info refresh failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {
    }
  }

}

customElements.define('stpc-player-body-tone-controls', PlayerBodyToneControls);
