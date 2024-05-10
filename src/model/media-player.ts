import { SoundTouchPlusHassEntity } from '../types/hassentity-soundtouchplus'
import { SoundTouchPlusHassEntityAttributes } from '../types/hassentityattributes-soundtouchplus'

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
}
