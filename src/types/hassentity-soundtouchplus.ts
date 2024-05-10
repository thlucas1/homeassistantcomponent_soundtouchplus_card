import { Context } from 'home-assistant-js-websocket';
import { SoundTouchPlusHassEntityAttributes } from '../types/hassentityattributes-soundtouchplus';

/**
 * SoundTouchPlus MediaPlayer Hass Entity type.
 * 
 * Hass state representation of a SoundTouchPlus MediaPlayer integration.
 * This is a copy of the HassEntityBase object, but with the `attributes`
 * key mapped to the SoundTouchPlusHassEntityAttributes type.
 */
export declare type SoundTouchPlusHassEntity = {
  entity_id: string;
  state: string;
  last_changed: string;
  last_updated: string;
  attributes: SoundTouchPlusHassEntityAttributes;
  context: Context;
};