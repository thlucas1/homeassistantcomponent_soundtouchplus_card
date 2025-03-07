/**
 * SoundTouch device generic Control Level Info configuration object.
 * 
 * This class contains the attributes and sub-items that represent a
 * control value configuration for the device.  
 */
export interface IControlLevelInfo {

  /** 
   * Type of control the values represent (e.g. "bass", "treble", etc).
   */
  control_type?: string;

  /** 
   * Minimum allowed value.
   * */
  min_value?: number;

  /** 
   * Maximum allowed value.
   * */
  max_value?: number;

  /** 
   * Amount the value can increase or decrease at a time.
   * */
  step?: number;

  /** 
   * Current value of the tone control.
   * */
  value?: number;

}

