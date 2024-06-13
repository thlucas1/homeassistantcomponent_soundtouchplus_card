// lovelace card imports.
import { LovelaceCardConfig } from 'custom-card-helpers';

// our imports.
import { Section } from './section'
import { CustomImageUrls } from './customimageurls'
import { ContentItemParent } from './soundtouchplus/contentitem';

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
   * This value supports Title Formatter Options.
   */
  title?: string;

  /**
   * Width of the card (in 'rem' units).
   * A value of "fill" can also be used (requires manual editing) to use 100% of 
   * the available horizontal space (good for panel dashboards).
   * Default is 35.15rem.
   */
  width?: string | number;

  /**
   * Height of the card (in 'rem' units).
   * A value of "fill" can also be used (requires manual editing) to use 100% of 
   * the available vertical space (good for panel dashboards).
   * Default is 35.15rem.
   */
  height?: string | number;

  /**
   * User account used to connect to Pandora music service.
   * This account must be defined in the SoundTouch device source list.
   */
  pandoraSourceAccount?: string;

  /**
   * Title displayed at the top of the Pandora media browser section form.
   * Omit this parameter to hide the title display area.
   * This value supports Title Formatter Options.
   */
  pandoraBrowserTitle?: string;

  /**
   * Sub-title displayed at the top of the Pandora media browser section form.
   * Omit this parameter to hide the sub-title display area.
   * This value supports Title Formatter Options.
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
   * Title displayed in the header area of the Player section form.
   * Omit this parameter to hide the title display area.
   * This value supports Title Formatter Options.
   */
  playerHeaderTitle?: string;

  /**
   * Artist and Track info displayed in the header area of the Player section form.
   * Omit this parameter to hide this area.
   * This value supports Title Formatter Options.
   */
  playerHeaderArtistTrack?: string;

  /**
   * Album info displayed in the header area of the Player section form.
   * Omit this parameter to hide this area.
   * This value supports Title Formatter Options.
   */
  playerHeaderAlbum?: string;

  /**
   * Text to display in the header area of the Player section form
   * when no media is currently playing.
   * Omit this parameter to display the default 'No Media Playing' value.
   * This value supports Title Formatter Options.
   */
  playerHeaderNoMediaPlayingText?: string;

  /** 
   * Hide progress bar in the header area of the Player section form.
   * Default is false.
   */
  playerHeaderHideProgressBar?: boolean;

  /**
   * Opacity value for the header area background of the Player section form.
   * Default is 0.4.
   */
  playerHeaderBackgroundOpacity?: number;

  /** 
   * Hide header area of the Player section form.
   * Default is false.
   */
  playerHeaderHide?: boolean;

  /** 
   * Hide play / pause button in the controls area of the Player section form.
   * Default is false.
   */
  playerControlsHidePlayPause?: boolean;

  /**
   * Hide repeat button in the controls area of the Player section form.
   * Default is false.
   */
  playerControlsHideRepeat?: boolean;

  /**
   * Hide shuffle button in the controls area of the Player section form.
   * Default is false.
   */
  playerControlsHideShuffle?: boolean;

  /**
   * Hide next track button in the controls area of the Player section form.
   * Default is false.
   */
  playerControlsHideTrackNext?: boolean;

  /**
   * Hide previous track button in the controls area of the Player section form.
   * Default is false.
   */
  playerControlsHideTrackPrev?: boolean;

  /**
   * Hide controls area of the Player section form.
   * Default is false.
   */
  playerControlsHide?: boolean;

  /**
   * Opacity value for the controls area background of the Player section form.
   * Default is 0.4.
   */
  playerControlsBackgroundOpacity?: number;

  /**
   * Hide mute button in the volume controls area of the Player section form.
   * Default is false.
   */
  playerVolumeControlsHideMute?: boolean;

  /** 
   * Hide power button in the volume controls area of the Player section form.
   * Default is false.
   */
  playerVolumeControlsHidePower?: boolean;

  /**
   * Hide volume slider in the volume controls area of the Player section form.
   * Default is false.
   */
  playerVolumeControlsHideSlider?: boolean;

  /**
   * Title displayed at the top of the Preset media browser section form.
   * Omit this parameter to hide the title display area.
   * This value supports Title Formatter Options.
   */
  presetBrowserTitle?: string;

  /**
   * Sub-title displayed at the top of the Preset media browser section form.
   * Omit this parameter to hide the sub-title display area.
   * This value supports Title Formatter Options.
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
   * This value supports Title Formatter Options.
   */
  recentBrowserTitle?: string;

  /**
   * Sub-title displayed at the top of the Recently Played media browser section form.
   * Omit this parameter to hide the sub-title display area.
   * This value supports Title Formatter Options.
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
   * Title displayed at the top of the Source browser section form.
   * Omit this parameter to hide the title display area.
   * This value supports Title Formatter Options.
   */
  sourceBrowserTitle?: string;

  /**
   * Sub-title displayed at the top of the Source browser section form.
   * Omit this parameter to hide the sub-title display area.
   * This value supports Title Formatter Options.
   */
  sourceBrowserSubTitle?: string;

  /**
   * Number of items to display in a single row of the Source browser section form.
   * Use a value of 1 to display the items as a vertical list.
   * Default is 3.
   */
  sourceBrowserItemsPerRow?: number;

  /** 
   * Hide titles displayed for Source browser items.
   * Default is false.
   */
  sourceBrowserItemsHideTitle?: boolean;

  /**
   * Title displayed at the top of the Preset media browser section form.
   * Omit this parameter to hide the title display area.
   * This value supports Title Formatter Options.
   */
  userPresetBrowserTitle?: string;

  /**
   * Sub-title displayed at the top of the User Preset media browser section form.
   * Omit this parameter to hide the sub-title display area.
   * This value supports Title Formatter Options.
   */
  userPresetBrowserSubTitle?: string;

  /**
   * Number of items to display in a single row of the User Preset media browser section form.
   * Use a value of 1 to display the items as a vertical list.
   * Default is 3.
   */
  userPresetBrowserItemsPerRow?: number;

  /** 
   * Hide titles displayed for User Preset media browser items.
   * Default is false.
   */
  userPresetBrowserItemsHideTitle?: boolean;

  /** 
   * Hide source titles displayed for User Preset media browser items.
   * Default is false.
   */
  userPresetBrowserItemsHideSource?: boolean;

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

  /**
   * Collection of user-defined preset items that can be displayed in various media browser
   * displays.  This allows the user to define their own custom presets along with device presets.
   * 
   * This configuration data must be configured manually in the card configuration.
   * Some things to keep in mind when adding entries:
   * - attribute names are are CaSe-SeNsItIvE.
   * 
   * See wiki dicumentation for more examples.
   * 
   * Example:
   * userPresets:
   * - ContentItem:
   *     Name: "K-Love Radio"
   *     ContainerArt: "http://cdn-profiles.tunein.com/s33828/images/logog.png?t=637986894890000000"
   *     Location: "/v1/playback/station/s33828"
   *     Source: "TUNEIN"
   *     TypeValue: "stationurl"
   */
  userPresets?: Array<ContentItemParent>;

  /**
   * File path to a collection of user-defined preset items that can be displayed in various media browser
   * displays.  This allows the user to define their own custom presets along with device presets.
   * 
   * See `userPresets` configuration item for file content format.
   */
  userPresetsFile?: string;

  //imageUrlsReplaceHttpWithHttps?: boolean;
}
