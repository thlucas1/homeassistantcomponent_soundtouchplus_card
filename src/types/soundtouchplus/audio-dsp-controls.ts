/**
 * SoundTouch device Audio DSP Controls configuration object.
 * 
 * This class contains the attributes and sub-items that represent the 
 * audio dsp controls configuration of the device.
 */
export interface IAudioDspControls {

  /** 
   * Audio mode value (e.g. "AUDIO_MODE_NORMAL", "AUDIO_MODE_DIALOG", etc).
   */
  audio_mode?: string;

  /** 
   * Video syncronization audio delay value (in milliseconds). 
   * Suggested range is 0 - 250ms, in increments of 10.
   */
  video_sync_audio_delay?: string;

  /**
   * A list of Supported audio modes (e.g. "AUDIO_MODE_NORMAL", "AUDIO_MODE_DIALOG", etc).
   */
  supported_audio_modes?: Array<string>;

  /** Date and time (in epoch format) of when the object was last updated.  */
  LastUpdatedOn?: number;

}
