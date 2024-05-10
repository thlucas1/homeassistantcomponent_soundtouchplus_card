import { SourceItem } from './sourceitem';

/**
 * SoundTouch device SourceList configuration object.
 * 
 * This interface contains the attributes and subitems that represent the
 * source list configuration of the device.
 */
export interface SourceList {

  /** 
   * Date and time (in epoch format) of when the list was last updated.  
   * Note that this attribute does not exist in the service response.  It was added here for convenience.
   */
  LastUpdatedOn?: number;

  /** Device identifier the configuration information was obtained from. */
  DeviceId?: string;

  /** List of `SourceItem` items. */
  SourceItems?: Array<SourceItem>;
}
