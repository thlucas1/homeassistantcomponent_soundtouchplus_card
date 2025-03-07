/**
 * SoundTouch device Component configuration object.
 * 
 * This class contains the attributes and sub-items that represents a
 * component configuration of the device.
 */
export interface IComponent {

  /** 
   * Component category (e.g. "SCM", "SMSC", etc).
   */
  component_category?: string;

  /** 
   * A unique manufacturer assigned serial number of the device.
   */
  serial_number?: string;

  /** 
   * Current operating system software of the device.
   */
  software_version?: string;

  /** 
   * Date and time (in epoch format) of when the item was last updated.  
   * Note that this attribute does not exist in the service response.  It was added here for convenience.
   */
  LastUpdatedOn?: number;

}
