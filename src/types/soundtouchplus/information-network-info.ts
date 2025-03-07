/**
 * SoundTouch device Information NetworkInfo configuration object.
 * 
 * This class contains the attributes and sub-items that represent the 
 * Information NetworkInfo configuration of the device.
 */
export interface IInformationNetworkInfo {

  /** 
   * MAC address (media access control address) assigned to the adapter.
   */
  mac_address?: string;

  /** 
   * IPV4 address assigned by the network.
   */
  ip_address?: string;

  /** 
   * Network interface adapter type (e.g. WIFI, ETHERNET).
   */
  type_value?: string;

  /** 
   * Date and time (in epoch format) of when the item was last updated.  
   * Note that this attribute does not exist in the service response.  It was added here for convenience.
   */
  LastUpdatedOn?: number;

}
