import { Recent } from './Recent';

/**
 * SoundTouch device RecentList configuration object.
 * 
 * This interface contains the attributes and subitems that represent the
 * recent configuration of the device.
 */
export interface RecentList {

  /** Date and time (in epoch format) of when the list was last updated.  */
  LastUpdatedOn?: number;

  /** List of `Recent` items. */
  Recents?: Array<Recent>;
}
