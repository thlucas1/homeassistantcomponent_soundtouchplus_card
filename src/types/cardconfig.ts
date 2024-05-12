// lovelace card imports.
import { LovelaceCardConfig } from 'custom-card-helpers';

// our imports.
import { Section } from './section'
import { CustomImageUrls } from './customimageurls'

/**
 * Card configuration settings.
 */
export interface CardConfig extends LovelaceCardConfig {

  /** 
   * Entity ID of the SoundTouchPlus device that will process the request. 
   */
  entity: string;

  /** 
   * Sections of the card to display. 
   * Valid values are:
   * - `presets` Presets section will be displayed.
   * - `recents` Recently Played section will be displayed.
   * - `pandorastations` Pandora Stations section will be displayed.
   */
  sections?: Section[];

  /**
   * Title that is displayed at the top of the card, above the section area.
   * This value supports MediaPlayer override parameters.
   */
  title?: string;

  /**
   * Width of the card (in 'rem' units).
   * A value of "fill" can also be used (requires manual editing) to use 100% of 
   * the available horizontal space (good for panel dashboards).
   * Default is 35.15rem.
   */
  width?: any;

  /**
   * Height of the card (in 'rem' units).
   * A value of "fill" can also be used (requires manual editing) to use 100% of 
   * the available vertical space (good for panel dashboards).
   * Default is 35.15rem.
   */
  height?: any;

  /**
   * Title displayed at the top of the Preset media browser section form.
   * Omit this parameter to hide the title display area.
   * This value supports MediaPlayer override parameters.
   */
  presetBrowserTitle?: string;

  /**
   * Sub-title displayed at the top of the Preset media browser section form.
   * Omit this parameter to hide the sub-title display area.
   * This value supports MediaPlayer override parameters.
   */
  presetBrowserSubTitle?: string;

  /**
   * Number of items to display in a single row of the Preset media browser section form.
   * Use a value of 1 to display the items as a vertical list.
   * Default is 3.
   */
  presetBrowserItemsPerRow?: number;

  /** 
   * Hide titles displayed for Preset media browser items.
   * Default is false.
   */
  presetBrowserItemsHideTitle?: boolean;

  /** 
   * Hide source titles displayed for Preset media browser items.
   * Default is false.
   */
  presetBrowserItemsHideSource?: boolean;

  /**
   * Title displayed at the top of the Recently Played media browser section form.
   * Omit this parameter to hide the title display area.
   * This value supports MediaPlayer override parameters.
   */
  recentBrowserTitle?: string;

  /**
   * Sub-title displayed at the top of the Recently Played media browser section form.
   * Omit this parameter to hide the sub-title display area.
   * This value supports MediaPlayer override parameters.
   */
  recentBrowserSubTitle?: string;

  /**
   * Number of items to display in a single row of the Recently Played media browser section form.
   * Use a value of 1 to display the items as a vertical list.
   * Default is 3.
   */
  recentBrowserItemsPerRow?: number;

  /** 
   * Hide titles displayed for Recently Played media browser items.
   * Default is false.
   */
  recentBrowserItemsHideTitle?: boolean;

  /** 
   * Hide source titles displayed for Recently Played media browser items.
   * Default is false.
   */
  recentBrowserItemsHideSource?: boolean;


  /**
   * User account used to connect to Pandora music service.
   * This account must be defined in the SoundTouch device source list.
   */
  pandoraSourceAccount?: string;

  /**
   * Title displayed at the top of the Pandora media browser section form.
   * Omit this parameter to hide the title display area.
   * This value supports MediaPlayer override parameters.
   */
  pandoraBrowserTitle?: string;

  /**
   * Sub-title displayed at the top of the Pandora media browser section form.
   * Omit this parameter to hide the sub-title display area.
   * This value supports MediaPlayer override parameters.
   */
  pandoraBrowserSubTitle?: string;

  /**
   * Number of items to display in a single row of the Pandora media browser section form.
   * Use a value of 1 to display the items as a vertical list.
   * Default is 3.
   */
  pandoraBrowserItemsPerRow?: number;

  /** 
   * Hide titles displayed for Pandora media browser items.
   * Default is false.
   */
  pandoraBrowserItemsHideTitle?: boolean;

  /**
   * Collection of custom imageUrl's that can be displayed in various media browser
   * displays.  This allows the user to override the image that is supplied by the
   * media player service, as well as provide imageUrl's for items that do not contain
   * an image.  This is especially useful for Spotify content in the recently played 
   * media browser, since the SoundTouch device removes the container art due to Spotify
   * copyright limitations with images.
   * 
   * This configuration data must be configured manually in the card configuration.
   * Some things to keep in mind when adding entries:
   * - imageUrl titles are CaSe-SeNsItIvE.
   * - imageUrl titles can contain special characters, but they are removed under the covers for the comparison process.
   * - you can use "local" references for the imageUrl; any spaces in the filename are replaced with "%20".
   * - you can use home assistant brands for the imageUrl; "logo.png" reference is replaced with "icon.png".
   * - the "default" imageUrl title is used to supply an imageUrl for items that do not have an image.
   * 
   * Example:
   * customImageUrls:
   *   default: /local/images/soundtouchplus_card_customimages/default.png
   *   empty preset: /local/images/soundtouchplus_card_customimages/empty_preset.png
   *   Daily Mix 1: /local/images/soundtouchplus_card_customimages/logo_spotify.png
   *   I Need You: https://i.scdn.co/image/ab67616d0000b2734bfd0e91bf806bc73d736cfd
   *   LiGhT rAiLs *?????: /local/images/soundtouchplus_card_customimages/LiGhT rAiLs.png
   *   My Private Playlist: https://brands.home-assistant.io/soundtouchplus/icon.png
   *   My Private Playlist2: https://brands.home-assistant.io/soundtouchplus/logo.png
   */
  customImageUrls?: CustomImageUrls;


  fallbackArtwork?: string;
  //imageUrlsReplaceHttpWithHttps?: boolean;
}
