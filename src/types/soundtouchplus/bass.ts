/**
 * SoundTouch device Bass configuration object.
 * 
 * This class contains the attributes and sub-items that represent the 
 * bass configuration of the device.
 */
export interface IBass {

  /** 
   * Actual value of the bass level.
   */
  actual?: number;

  /** 
   * Device identifier the configuration information was obtained from.
   */
  device_id?: string;

  /**
   * Targeted value of the bass level.
   */
  target?: number;

  /** Date and time (in epoch format) of when the object was last updated.  */
  LastUpdatedOn?: number;

}
