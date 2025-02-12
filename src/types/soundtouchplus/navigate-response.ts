import { INavigateItem } from './navigate-item';

/**
 * SoundTouch device NavigateResponse configuration object.
 * 
 * This interface contains the attributes and subitems that represent the
 * navigate response configuration of the device.
 */
export interface INavigateResponse {

  /** 
   * Date and time (in epoch format) of when the list was last updated.  
   * Note that this attribute does not exist in the service response.  It was added here for convenience.
   */
  LastUpdatedOn?: number;

  /** 
   * The number of items in the `Items` list.  
   * 
   * Note that this could be different than the `TotalItems` property if
   * the user is limiting the returned results.
   */
  ItemCount?: number;

  /** 
   * List of `INavigateItem` items. 
   */
  Items?: Array<INavigateItem>;

  /** 
   * Music service source where the result was obtained from (e.g. "PANDORA", etc). 
   */
  Source?: string;

  /** 
   * The account associated with the Source. 
   */
  SourceAccount?: string;

  /**
   * The source title of media content (e.g. "Pandora (userid)", etc).
   */ 
  SourceTitle?: string;

  /** 
   * The total number of items in the list, as reported by the music service.
   */
  TotalItems?: number;

}
