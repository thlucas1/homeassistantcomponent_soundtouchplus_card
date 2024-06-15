// our imports.
import { SoundTouchPlusHassEntity } from '../types/hassentity-soundtouchplus'
import { SoundTouchPlusHassEntityAttributes } from '../types/hassentityattributes-soundtouchplus'
import { MediaPlayerEntityFeature } from '../types/mediaplayer-entityfeature'

const { TURN_ON } = MediaPlayerEntityFeature;

//const LOGPFX = "STPC - model/media-player."

/**
 * SoundTouchPlus MediaPlayer class.
 * 
 * An instance of this class is created from Home Assistant state data that 
 * represents a SoundTouchPlusHassEntity type.  It contains all attributes
 * of a HASS entity and HASS MediaPlayer, as well as the custom attributes
 * created by the SoundTouchPlus integration MediaPlayer.
 */
export class MediaPlayer {

  attributes: SoundTouchPlusHassEntityAttributes;
  id: string;
  name: string;
  state: string;

  /**
   * Initializes a new instance of the class.
   * 
   * @param hassEntity Home Assistant state data that represents a SoundTouchPlusHassEntity type.
   */
  constructor(hassEntity: SoundTouchPlusHassEntity) {

    // initialize storage.
    this.id = hassEntity.entity_id;
    this.state = hassEntity.state;
    this.attributes = hassEntity.attributes;
    this.name = this.attributes.friendly_name || '';
  }


  /**
   * Returns a string containing currently playing media track information in the form of:
   * "<media_artist> - <media_title>"
   */
  public getCurrentTrack(): string {
    return `${this.attributes.media_artist || ''} - ${this.attributes.media_title || ''}`.replace(/^ - | - $/g, '');
  }


  /**
   * Returns the current volume of the player as a percentage value (e.g. 0-100).
   */
  public getVolume() {
    if (this.attributes.volume_level) {
      return 100 * this.attributes.volume_level;
    } else {
      return 0;
    }
  }


  /**
   * Returns true if the player is currently playing something (e.g. state = 'playing'); 
   * otherwise, false.
   */
  public isPlaying() {
    return this.state === 'playing';
  }


  /**
   * Returns true if the player is currently powered off (e.g. state = 'off'); 
   * otherwise, false.
   */
  public isPoweredOff() {
    return this.state === 'off';
  }


  /**
   * Returns true if the player is currently powered off (e.g. state = 'off'); 
   * otherwise, false.
   */
  public isPoweredOffOrUnknown() {
    return this.state === 'off' || this.state === 'unknown';
  }


  /**
   * Returns true if the player volume is currently muted; 
   * otherwise, false.
   */
  public isMuted(): boolean {
    return this.attributes.is_volume_muted || false;
  }


  /**
   * Returns true if the player supports TURN_ON feature;
   * otherwise, false.
   */
  public supportsTurnOn() {
    return ((this.attributes.supported_features || 0) & TURN_ON) == TURN_ON;
  }


}
