/**
 * SoundTouch device BassCapabilities configuration object.
 * 
 * This class contains the attributes and sub-items that represent the 
 * bass capabilities configuration of the device.
 */
export interface IBassCapabilities {

  /** 
   * Default value of the bass level.
   */
  default_value?: number;

  /** 
   * Device identifier the configuration information was obtained from.
   */
  device_id?: string;

  /** 
   * Returns True if the bass level of the device is adjustable; otherwise, False.
   */
  is_available?: boolean;

  /**
   * Maximum allowed value of the bass level.
   */
  maximum?: number;

  /**
   * Maximum minimum value of the bass level.
   */
  minimum?: number;

  /** Date and time (in epoch format) of when the object was last updated.  */
  LastUpdatedOn?: number;

}
