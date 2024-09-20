// lovelace card imports.
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';

// our imports.
import { HassService } from './hass-service';
import { MediaPlayerItem } from '../types';
import { MediaPlayer } from '../model/media-player';
import { DOMAIN_MEDIA_PLAYER } from '../constants';

export class MediaControlService {

  private hassService: HassService;


  /**
   * Initializes a new instance of the class.
   * 
   * @param hassService HassService object.
   */
  constructor(hassService: HassService) {
    this.hassService = hassService;
  }


  /**
   * Add players to a master player zone.
   * 
   * @param master Player entity-id of the master zone.
   * @param groupMembers An array of Player entity-id's to add to the master zone.
   */
  public async join(master:string, groupMembers:string[]) {

    // create service request.
    const serviceRequest: ServiceCallRequest = {
      domain: DOMAIN_MEDIA_PLAYER,
      service: 'join',
      serviceData: {
        entity_id: master,
        group_members: groupMembers,
      }
    };

    // call the service.
    await this.hassService.CallService(serviceRequest);
  }


  /**
   * Remove players from a master player zone.
   * 
   * @param playerIds An array of Player entity-id's to remove from the master zone.
   */
  public async unJoin(playerIds:string[]) {

    // create service request.
    const serviceRequest: ServiceCallRequest = {
      domain: DOMAIN_MEDIA_PLAYER,
      service: 'unjoin',
      serviceData: {
        entity_id: playerIds,
      }
    };

    // call the service.
    await this.hassService.CallService(serviceRequest);
  }


  /**
   * Selects a source on the specified media player.
   * 
   * @param player MediaPlayer object to control.
   * @param source Source to select.
   */
  public async sourceSelect(player:MediaPlayer, source:string) {

    // create service request.
    const serviceRequest: ServiceCallRequest = {
      domain: DOMAIN_MEDIA_PLAYER,
      service: 'select_source',
      serviceData: {
        entity_id: player.id,
        source: source,
      }
    };

    // call the service.
    await this.hassService.CallService(serviceRequest);
  }


  /**
   * Plays the specified media content.
   * 
   * @param player MediaPlayer object to control.
   * @param item MediaPlayerItem object that contains media information to play.
   */
  public async playMedia(player:MediaPlayer, item:MediaPlayerItem) {

    // create service request.
    const serviceRequest: ServiceCallRequest = {
      domain: DOMAIN_MEDIA_PLAYER,
      service: 'play_media',
      serviceData: {
        entity_id: player.id,
        media_content_id: item.media_content_id,
        media_content_type: item.media_content_type,
      }
    };

    // call the service.
    await this.hassService.CallService(serviceRequest);
  }


  /**
   * Seeks to the specified position in a playing track.
   * 
   * @param player MediaPlayer object to control.
   * @param position Desired position to seek to.
   */
  public async seek(player:MediaPlayer, position:number) {

    // create service request.
    const serviceRequest: ServiceCallRequest = {
      domain: DOMAIN_MEDIA_PLAYER,
      service: 'media_seek',
      serviceData: {
        entity_id: player.id,
        seek_position: position,
      }
    };

    // call the service.
    await this.hassService.CallService(serviceRequest);
  }


  /**
   * Mutes / unmutes the player volume.
   * 
   * @param player MediaPlayer object to control.
   * @param muteVolume True to mute the volume; otherwise, False to unmute the volume.
   */
  public async volumeMute(player:MediaPlayer, muteVolume:boolean) {

    // create service request.
    const serviceRequest: ServiceCallRequest = {
      domain: DOMAIN_MEDIA_PLAYER,
      service: 'volume_mute',
      serviceData: {
        entity_id: player.id,
        is_volume_muted: muteVolume,
      }
    };

    // call the service.
    await this.hassService.CallService(serviceRequest);
  }


  /**
   * Sets the player volume.
   * 
   * @param player MediaPlayer object to control.
   * @param volumePercent Volume level to set, expressed as a percentage (e.g. 1 - 100).
   */
  public async volumeSet(player:MediaPlayer, volumePercent: number) {

    const volumeLevel = volumePercent / 100;

    // create service request.
    const serviceRequest: ServiceCallRequest = {
      domain: DOMAIN_MEDIA_PLAYER,
      service: 'volume_set',
      serviceData: {
        entity_id: player.id,
        volume_level: volumeLevel,
      }
    };

    // call the service.
    await this.hassService.CallService(serviceRequest);
  }


  /**
   * Toggles the volume mute status of the player; 
   * if muted, then it will be unmuted;
   * if unmuted, then it will be muted;
   * 
   * @param player MediaPlayer object to control.
   * @param muteVolume True to mute the volume; otherwise, False to unmute the volume.
   */
  public async volumeMuteToggle(player: MediaPlayer) {

    const muteVolume = !player.isMuted();
    await this.volumeMute(player, muteVolume);
  }

}
