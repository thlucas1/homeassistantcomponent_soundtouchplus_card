/**
 * SoundTouch device ContentItem configuration object.
 * 
 * This interface contains the attributes and subitems that represent the 
 * content item (e.g.media source) configuration of the device.  
 * 
 * Instances of this class can be used to switch the input source of media.
 */
export interface ContentItem {

  /** Item's container art url. */
  ContainerArt?: string;

  /** Returns True if the content item is part of a navigate result; otherwise, False. */
  IsNavigate?: boolean;

  /** Returns True if the content item can be saved as a Preset; otherwise, False. */
  IsPresetable?: boolean;

  /** If present, a direct url link to the media. */
  Location?: string;

  /** Item's name. */
  Name?: string;

  /** If present, the offset of the currently playing content. */
  Offset?: number;

  /** The type or name of the service that is currently playing or to be played. */
  Source?: string;

  /** The account associated with the Source. */
  SourceAccount?: string;

  /** Specifies the type of this item. */
  TypeValue?: string;
}


/**
* SoundTouch ContentItem parent configuration object.
* 
* This interface contains the attributes and subitems that represent a
* single object that contains a ContentItem attribute.
*/
export interface ContentItemParent {

  /** ContentItem object. */
  ContentItem?: ContentItem;
}
