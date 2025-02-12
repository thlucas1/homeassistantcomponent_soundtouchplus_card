// our imports.
import { SoundTouchPlusHassEntity } from '../types/soundtouchplus-hass-entity';
import { SoundTouchPlusHassEntityAttributes } from '../types/soundtouchplus-hass-entity-attributes';
import { MediaPlayerEntityFeature, MediaPlayerState } from '../services/media-control-service';


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
  state: MediaPlayerState;

  /**
   * Initializes a new instance of the class.
   * 
   * @param hassEntity Home Assistant state data that represents a SoundTouchPlusHassEntity type.
   */
  constructor(hassEntity: SoundTouchPlusHassEntity) {

    // initialize storage.
    this.id = hassEntity.entity_id;
    this.state = hassEntity.state as MediaPlayerState;
    this.attributes = hassEntity.attributes;
    this.name = this.attributes.friendly_name || '';
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
    return this.state === MediaPlayerState.PLAYING;
  }


  /**
   * Returns true if the player is currently powered off (e.g. state = 'off'); 
   * otherwise, false.
   */
  public isPoweredOff() {
    return this.state === MediaPlayerState.OFF;
  }


  /**
   * Returns true if the player is currently powered off (e.g. state = 'off'); 
   * otherwise, false.
   */
  public isPoweredOffOrUnknown() {
    return this.state === MediaPlayerState.OFF || this.state === MediaPlayerState.UNKNOWN;
  }


  /**
   * Returns true if the player volume is currently muted; 
   * otherwise, false.
   */
  public isMuted(): boolean {
    return this.attributes.is_volume_muted || false;
  }


  /**
   * Returns true if the player supports requested feature;
   * otherwise, false.
   */
  public supportsFeature(feature: MediaPlayerEntityFeature) {
    return ((this.attributes.supported_features || 0) & feature) == feature;
  }

}
