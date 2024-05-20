// lovelace card imports.
import { HomeAssistant } from 'custom-card-helpers';

// our imports.
import { HassService } from '../services/hass-service';
import { MediaControlService } from '../services/media-control-service';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { CardConfig } from '../types/cardconfig'
import { Section } from '../types/section'
import { MediaPlayerEntityFeature } from '../types/mediaplayer-entityfeature'
import { MediaPlayer } from './media-player';

const { TURN_OFF, TURN_ON } = MediaPlayerEntityFeature;

const PARENTELEMENT_TAGNAME_HUI_CARD_OPTIONS = 'HUI-CARD-OPTIONS';
const PARENTELEMENT_TAGNAME_HUI_CARD_PREVIEW = 'HUI-CARD-PREVIEW';


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
  private readonly card: Element;

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
    this.card = card;
    this.hassService = new HassService(hass, card, section);
    this.mediaControlService = new MediaControlService(this.hassService);
    this.soundTouchPlusService = new SoundTouchPlusService(hass, card, section);
    this.player = this.getMediaPlayerObject(playerId);
    this.section = section;

  //  console.log("View ParentElement tagname info:\n parentElement1=%s\n parentElement2=%s\n parentElement3=%s\n parentElement4=%s\n parentElement5=%s\n parentElement6=%s",
  //    this.card.parentElement?.tagName,
  //    this.card.parentElement?.parentElement?.tagName,
  //    this.card.parentElement?.parentElement?.parentElement?.tagName,
  //    this.card.parentElement?.parentElement?.parentElement?.parentElement?.tagName,
  //    this.card.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.tagName,
  //    this.card.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.tagName);
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

    //console.log("getMediaPlayerObject - hassEntity[0]:\n", JSON.stringify(hassEntity[0]))
    
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
   * 
   * @param hideIfOn True if the power button should be hidden while the player is on; 
   * otherwise, False to always show the power button if the media player supports the TURN_ON feature.
   */
  public showPower(hideIfOn = false) {
    if (this.config.playerVolumeControlsHidePower || false) {
      console.log("store.showPower() - power is hidden");
      return [];
    } else if (!this.player.supportsTurnOn()) {
      return [];
    } else if (hideIfOn && this.player.state != 'off') {
      return [];
    } else {
      return [TURN_ON, TURN_OFF];
    }
  }


  /**
   * Returns true if the dashboard editor is active;
   * otherwise, false.
   */
  public isInPanelView() {
    //return (this.card.parentElement?.tagName == PARENTELEMENT_TAGNAME_HUI_CARD_OPTIONS);
    return false;
  }


  /**
   * Returns true if the dashboard editor is active;
   * otherwise, false.
   */
  public isInDashboardEditor() {
    return (this.card.parentElement?.tagName == PARENTELEMENT_TAGNAME_HUI_CARD_OPTIONS);
  }


  /**
   * Returns true if the card is currently being previewed in the card editor; 
   * otherwise, false.
   */
  public isInCardEditPreview() {
    return (this.card.parentElement?.tagName == PARENTELEMENT_TAGNAME_HUI_CARD_PREVIEW);
  }

}
