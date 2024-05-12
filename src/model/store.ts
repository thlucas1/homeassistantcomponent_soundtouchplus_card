import { HomeAssistant } from 'custom-card-helpers';
import { HassService } from '../services/hass-service';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { CardConfig } from '../types/cardconfig'
import { Section } from '../types/section'
import { MediaPlayer } from './media-player';

/**
 * Card storage class instance.  
 * 
 * This class is used to store references to common services and data areas
 * that are used by the various card sections.
 * */
export class Store {

  /** Home Assistant instance. */
  public hass: HomeAssistant;

  /** Card configuration data. */
  public config: CardConfig;

  /** Home Assistant services helper instance. */
  public hassService: HassService;

  /** SoundTouchPlus services helper instance. */
  public soundTouchPlusService: SoundTouchPlusService;

  /** SoundTouchPlus MediaPlayer object that will process requests. */
  public player: MediaPlayer;

  /** Currently selected section. */
  public section: Section;


  /**
   * Initializes a new instance of the class.
   * 
   * @param hass Home Assistant instance.
   * @param config Card configuration data.
   * @param card Custom card instance.
   * @param section Currently selected section of the card.
   * @param playerId Entity ID of the SoundTouchPlus device that will process requests.
   */
  constructor(hass: HomeAssistant, config: CardConfig, card: Element, section: Section, playerId: string) {

    // if hass property has not been set yet, then it's a programmer problem!
    if (!hass) {
      throw new Error("STPC0005 hass property has not been set!");
    }

    // initialize storage.
    this.hass = hass;
    this.config = config;
    this.hassService = new HassService(hass, card, section);
    this.soundTouchPlusService = new SoundTouchPlusService(hass, card, section);
    this.player = this.getMediaPlayerObject(playerId);
    this.section = section;
  }


  /**
   * Returns a MediaPlayer object for the given entity id value.
   * 
   * @param entityId Entity ID of the media player.
   * @returns A MediaPlayer object.
   * @throws Error if the specified entityId values does not exist in the hass.states data.
   */
  public getMediaPlayerObject(entityId: string) {

    // does entity id exist in hass state data?
    const hassEntity = Object.values(this.hass.states)
      .filter((ent) => ent.entity_id.match(entityId));

    // if not, then it's an error!
    if (!hassEntity)
      throw new Error("Entity id '" + JSON.stringify(entityId) + "' does not exist in the state machine");

    // convert the hass state representation to a media player object.
    return new MediaPlayer(hassEntity[0]);
  }
}
