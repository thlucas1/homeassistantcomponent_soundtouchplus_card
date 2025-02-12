import { IPreset } from './preset';

/**
 * SoundTouch device PresetList configuration object.
 * 
 * This interface contains the attributes and subitems that represent the
 * preset configuration of the device.
 */
export interface IPresetList {

  /** Date and time (in epoch format) of when the list was last updated.  */
  LastUpdatedOn?: number;

  /** List of `Preset` items. */
  Presets?: Array<IPreset>;
}
