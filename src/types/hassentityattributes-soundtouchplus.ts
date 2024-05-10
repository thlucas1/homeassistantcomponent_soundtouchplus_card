import { HassEntityAttributesMediaPlayer } from '../types/hassentityattributes-mediaplayer';

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
  soundtouchplus_source?: string;
  soundtouchplus_sound_mode?: string;
  soundtouchplus_tone_bass_level?: string;
  soundtouchplus_tone_treble_level?: string;
};
