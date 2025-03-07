import { IInformationNetworkInfo } from './information-network-info';
import { IComponent } from './component';

/**
 * SoundTouch device details object.
 * 
 * This interface contains the attributes and subitems that represent the
 * SoundTouch device.
 */
export interface ISoundTouchDevice {

  /** 
   * List of `Component` objects containing various information about the 
   * device's components (e.g. SCM, LPM, BASS, etc).
   */
  components?: Array<IComponent>;

  /** 
   * Controls how long (in seconds) a connection request is allowed to run before being aborted.  
   */
  connect_timeout?: number;

  /** 
   * Country code of the device as assigned by the manufacturer (e.g. 'US', etc). 
   */
  country_code?: string;

  /**
   * Unique device identifier as assigned by the manufacturer (e.g. '9070658C9D4A', etc).
   */
  device_id?: string;

  /** 
   * Friendly name assigned to the SoundTouch device (e.g. 'Home Theater SoundBar', etc). 
   */
  device_name?: string;

  /**
   * Type of device as assigned by the manufacturer (e.g. 'SoundTouch 10', 'SoundTouch 300', etc). 
   */
  device_type?: string;

  /**
   * Ipv4 address of the SoundTouch device.
   */
  host: string;

  /** 
   * Ipv4 port number of the SoundTouch device.
   */
  ip_port: number;

  /** 
   * URL to download a logread file from this device.
   */
  log_read_url: string;

  /** 
   * MAC address (media access control address) assigned to the device.
   */
  mac_address: string;

  /** 
   * Radio module type used in the device, as assigned by the manufacturer (e.g. 'SM2', etc). 
   */
  module_type: string;

  /**
   * List of `InformationNetworkInfo` objects containing the current network configuration 
   * of the device.
   */
  network_info?: Array<IInformationNetworkInfo>;

  /**
   * URL to download a logread file.
   */
  pts_url: string;

  /** 
   * Region code of the device as assigned by the manufacturer (e.g. 'US', etc). 
   */
  region_code: string;

  /** 
   * Bose Streaming account UUID, as assigned by the manufacturer (e.g. '1234567', etc).
   */
  streaming_account_uuid: string;

  /** 
   * Bose Streaming URL, as assigned by the manufacturer (e.g. 'https://streaming.bose.com', etc).
   */
  streaming_url: string;

  /**
   * List of `SoundTouchUri` strings that the device supports.
   * 
   * These URI's are used by the SoundTouchClient class to obtain information from the 
   * device (e.g. info, nowPlaying, etc).
   */
  supported_uris?: Array<string>;

  /** 
   * List of url names that the device support, but are NOT recognized by the SoundTouch API.
   */
  unknown_url_names?: Array<string>;

  /** 
   * List of url names that are NOT supported by the device.
   */
  unsupported_url_names?: Array<string>;

  /**
   * Universal Plug and Play (UPnP) root URL for this device.
   * 
   * The document located at the returned URL contains additional information about
   * methods and properties that can be used with UPnP.
   */
  upnp_url: string;

  /** 
   * Variant value (e.g. 'ginger', etc). 
   */
  variant: string;

  /** 
   * Variant mode value (e.g. 'noap', etc). 
   */
  variant_mode: string;

  /** 
   * Date and time (in epoch format) of when the item was last updated.  
   * Note that this attribute does not exist in the service response.  It was added here for convenience.
   */
  LastUpdatedOn?: number;

}
