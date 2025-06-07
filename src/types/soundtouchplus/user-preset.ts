import { IContentItem } from "./content-item";

/**
* SoundTouch UserPreset parent configuration object.
* 
* This interface contains the attributes and subitems that represent a
* single object that contains a ContentItem attribute.
*/
export interface IUserPreset {

  /**
   * Text that will appear in the NowPlaying Artist node; if omitted, default is "Unknown Artist".
   */
  artist_name?: string;

  /**
   * Text that will appear in the NowPlaying Album node; if omitted, default is "Unknown Album".
   */
  album_name?: string;

  /** ContentItem object. */
  ContentItem?: IContentItem;

  /**
   * Origin location of the content item (e.g. `config`, `file`).
   */
  origin?: string | null;

  /**
   * Filter criteria that will be applied to the specified filter section.
   * This property should only be populated for type = "filtersection".
   * This is a UI helper property, and is not part of the SoundTouch Web API specification
   */
  filter_criteria?: string | null;

  /**
   * Section to be filtered.
   * This property should only be populated for type = "filtersection".
   * This is a UI helper property, and is not part of the SoundTouch Web API specification
   */
  filter_section?: string | null;

  /**
   * Item type (e.g. "filtersection", "dlnaurl", etc).
   */
  type: string | null;

}
