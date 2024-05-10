import { HassEntityAttributeBase } from 'home-assistant-js-websocket';

/**
 * MediaPlayer Hass Entity Attributes type.
 * 
 * Hass state attributes provided by the HA MediaPlayer integration.
 */
export declare type HassEntityAttributesMediaPlayer = HassEntityAttributeBase & {
  app_id?: string;
  app_name?: string;
  device_class?: string;
  group_members?: [string];
  is_volume_muted?: boolean;
  media_album_artist?: string;
  media_album_name?: string;
  media_artist?: string;
  media_channel?: string;
  media_content_id?: string;
  media_content_type?: string;
  media_duration?: number;
  media_episode?: string;
  media_image_hash?: string;
  media_image_remotely_accessible?: boolean;
  media_image_url?: string;
  media_playlist?: string;
  media_position_updated_at?: string;  // dt.datetime | None = None
  media_position?: number;
  media_season?: string;
  media_series_title?: string;
  media_title?: string;
  media_track?: number;
  repeat?: string;
  shuffle?: boolean;
  sound_mode_list?: [string];
  sound_mode?: string;
  source_list?: [string];
  source?: string;
  state?: string;  // MediaPlayerState | None = None
  supported_features?: number;  // MediaPlayerEntityFeature(0)
  volume_level?: number;
};
