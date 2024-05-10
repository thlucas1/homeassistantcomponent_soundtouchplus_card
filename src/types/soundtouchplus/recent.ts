import { ContentItem } from './contentitem';

/**
 * SoundTouch device Recent configuration object.
 * 
 * This interface contains the attributes and subitems that represent a
 * single recent configuration of the device.
 */
export interface Recent {

  /** ContentItem object. */
  ContentItem?: ContentItem;

  /** 
   * Date and time(in epoch format) of when the recent was created. 
   * It seems that on some devices(ST10) the SoundTouch WebServices API only returns
   * this attribute for the LAST recent that was stored; the value will not be present
   * for any other recents.Other devices(ST300) return this attribute on all items. 
   */
  CreatedOn?: number;

  /** 
   * Device identifier the configuration information was obtained from.
   */
  DeviceId?: string;

  /** Recent identifier. */
  RecentId?: number;

  /** 
   * The source title of media content(e.g. "Tunein", "Airplay", "NAS Music Server", etc). 
   * This property is not part of the returned xml of the configuration, but is set after
   * a call to`SoundTouchClient.GetrecentList(resolveSourceTitles=True)' so that source
   * titles can be displayed by user-interfaces. 
   */
  SourceTitle?: string;

}
