// lovelace card imports.
import { HomeAssistant } from 'custom-card-helpers';

// our imports.
import { HassService } from '../services/HassService';
import { MediaControlService } from '../services/MediaControlService';
import { SoundTouchPlusService } from '../services/SoundTouchPlusService';
import { Card } from '../card';
import { BaseEditor } from '../editor/base-editor';
import { CardConfig } from '../types/CardConfig';
import { ConfigArea } from '../types/ConfigArea';
import { Section } from '../types/Section';
import { MediaPlayerEntityFeature } from '../types/MediaPlayerEntityFeature';
import { MediaPlayer } from './MediaPlayer';

const { TURN_OFF, TURN_ON } = MediaPlayerEntityFeature;


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

  /** Custom card instance. */
  public readonly card: Card | BaseEditor;

  /** Home Assistant services helper instance. */
  public hassService: HassService;

  /** SoundTouchPlus services helper instance. */
  public soundTouchPlusService: SoundTouchPlusService;

  /** MediaControlService services helper instance. */
  public mediaControlService: MediaControlService;

  /** SoundTouchPlus MediaPlayer object that will process requests. */
  public player: MediaPlayer;

  /** Currently selected section. */
  public section: Section;

  /** Currently selected ConfigArea **/
  static selectedConfigArea: ConfigArea = ConfigArea.GENERAL;


  /**
   * Initializes a new instance of the class.
   * 
   * @param hass Home Assistant instance.
   * @param config Card configuration data.
   * @param card Custom card instance.
   * @param section Currently selected section of the card.
   * @param playerId Entity ID of the SoundTouchPlus device that will process requests.
   */
  constructor(hass: HomeAssistant, config: CardConfig, card: Card | BaseEditor, section: Section, playerId: string) {

    // if hass property has not been set yet, then it's a programmer problem!
    if (!hass) {
      throw new Error("STPC0005 hass property has not been set!");
    }

    // initialize storage.
    this.hass = hass;
    this.config = config;
    this.card = card;
    this.hassService = new HassService(hass, card, section);
    this.mediaControlService = new MediaControlService(this.hassService);
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

    //console.log("getMediaPlayerObject - hassEntity[0]:\n", JSON.stringify(hassEntity[0], null, 2))

    // convert the hass state representation to a media player object.
    return new MediaPlayer(hassEntity[0]);
  }


  //public getEntityDefinition(entityId: string) {

  //  //          # is the specified entity id in the hass entity registry ?
  //  //        # it will NOT be in the entity registry if it's deleted.
  //  //        # it WILL be in the entity registry if it is disabled, with disabled property = True.
  //  //  entity_registry = er.async_get(self.hass)
  //  //registry_entry: RegistryEntry = entity_registry.async_get(spotifyMPEntityId)
  //  //_logsi.LogObject(SILevel.Verbose, "'%s': MediaPlayer RegistryEntry for entity_id: '%s'" % (self.name, spotifyMPEntityId), registry_entry)

  //}


  /**
   * Returns [TURN_ON, TURN_OFF] if the power button should be shown;
   * otherwise, [].
   */
  public showMainPower() {

    // determine if the media player is powered on.
    const isPoweredOn = (['on', 'idle', 'playing', 'paused', 'standby', 'buffering'].indexOf(this.player.state) >= 0);
    //console.log("store.showMainPower()\ncurrent state=%s\nisPowerOn=%s", this.player.state, isPoweredOn);

    if (this.config.playerVolumeControlsHidePower || false) {
      // user disabled power control in configuration.
      //console.log("hide main power control since user disabled it in config");
      return [];
    }

    if (!this.player.supportsTurnOn()) {
      // media player does not support power (TURN_ON, TURN_OFF) features.
      //console.log("hide main power control since media_player does not support it");
      return [];
    }

    if (isPoweredOn == true) {
      // media player is powered on; hide main power control.
      // note that a power control is already shown in player controls next to volume.
      //console.log("hide main power control since media_player is powered on");
      return [];
    }

    // media player is powered off; show main power control.
    //console.log("show main power control");
    return [TURN_OFF, TURN_ON];
  }

}
