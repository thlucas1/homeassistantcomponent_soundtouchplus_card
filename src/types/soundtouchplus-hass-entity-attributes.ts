import { HassEntityAttributesMediaPlayer } from './hass-entity-attributes-media-player';

/**
 * SoundTouchPlus MediaPlayer Hass Entity Attributes type.
 * 
 * Hass state attributes provided by the SoundTouchPlus integration.
 * This also contains the HA MediaPlayer attributes, as the SoundTouchPlus
 * integration inherits from HA MediaPlayer.
 */
export declare type SoundTouchPlusHassEntityAttributes = HassEntityAttributesMediaPlayer & {
  soundtouchplus_nowplaying_isadvertisement?: boolean;
  soundtouchplus_nowplaying_isfavorite?: boolean;
  soundtouchplus_presets_lastupdated?: number;
  soundtouchplus_recents_lastupdated?: number;
  soundtouchplus_recents_cache_lastupdated?: number;
  soundtouchplus_recents_cache_enabled?: boolean;
  soundtouchplus_recents_cache_max_items?: number;
  soundtouchplus_source?: string;
  soundtouchplus_sound_mode?: string;
  soundtouchplus_tone_bass_level?: string;
  soundtouchplus_tone_treble_level?: string;
  stp_nowplaying_image_url?: string;
  stp_config_state?: string;
};
