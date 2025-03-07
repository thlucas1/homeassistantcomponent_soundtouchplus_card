import { IControlLevelInfo } from './control-level-info';

/**
 * SoundTouch device AudioProductToneControls configuration object.
 * 
 * This class contains the attributes and sub-items that represent the 
 * Audio Product Tone Controls configuration of the device.
 */
export interface IAudioProductToneControls {

  /** 
   * Audio product tone control settings for bass details.
   */
  bass: IControlLevelInfo;

  /** 
   * Audio product tone control settings for bass details.
   */
  treble: IControlLevelInfo;

  /** Date and time (in epoch format) of when the object was last updated.  */
  LastUpdatedOn?: number;

}
