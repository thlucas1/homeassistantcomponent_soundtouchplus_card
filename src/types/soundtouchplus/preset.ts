import { ContentItem } from './ContentItem';

/**
 * SoundTouch device Preset configuration object.
 * 
 * This interface contains the attributes and subitems that represent a
 * single preset configuration of the device.
 */
export interface Preset {

  /** ContentItem object. */
  ContentItem?: ContentItem;

  /** 
   * Date and time(in epoch format) of when the preset was created. 
   * It seems that on some devices(ST10) the SoundTouch WebServices API only returns
   * this attribute for the LAST preset that was stored; the value will not be present
   * for any other presets.Other devices(ST300) return this attribute on all items. 
   */
  CreatedOn?: number;

  /** Preset identifier (1 - 6). */
  PresetId?: number;

  /** 
   * The source title of media content(e.g. "Tunein", "Airplay", "NAS Music Server", etc). 
   * This property is not part of the returned xml of the configuration, but is set after
   * a call to`SoundTouchClient.GetPresetList(resolveSourceTitles=True)' so that source
   * titles can be displayed by user-interfaces. 
   */
  SourceTitle?: string;

  /** 
   * Date and time (in epoch format) of when the preset was last updated. 
   * It seems that on some devices (ST-10) the SoundTouch WebServices API only returns 
   * this attribute for the LAST preset that was stored; the value will not be present 
   * for any other presets.  Other devices (ST-300) return this attribute on all items.
   */
  UpdatedOn?: number;

}
