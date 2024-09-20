import { Preset } from './Preset';

/**
 * SoundTouch device PresetList configuration object.
 * 
 * This interface contains the attributes and subitems that represent the
 * preset configuration of the device.
 */
export interface PresetList {

  /** Date and time (in epoch format) of when the list was last updated.  */
  LastUpdatedOn?: number;

  /** List of `Preset` items. */
  Presets?: Array<Preset>;
}
