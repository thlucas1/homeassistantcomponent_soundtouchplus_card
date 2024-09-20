// lovelace card imports.
import { HomeAssistant } from 'custom-card-helpers';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';
import { HassEntity } from 'home-assistant-js-websocket';

// our imports.
import { ProgressStartedEvent } from '../events/progress-started';
import { ProgressEndedEvent } from '../events/progress-ended';
import { MediaPlayer } from '../model/media-player';
import { Section } from '../types/section'
import { MediaPlayerItem, TemplateResult } from '../types';


export class HassService {

  /** Home Assistant instance. */
  private readonly hass: HomeAssistant;

  /** Custom card instance. */
  private readonly card: Element;

  /** Currently selected section of the card. */
  private readonly section: Section;


  /**
   * Initializes a new instance of the class.
   * 
   * @param hass Home Assistant instance.
   * @param card Custom card instance.
   * @param section Currently selected section of the card.
   */
  constructor(hass: HomeAssistant, card: Element, section: Section) {
    this.hass = hass;
    this.card = card;
    this.section = section;
  }


  /**
   * Calls the specified MediaPlayer service, passing it the specified parameters.
   * 
   * @param serviceRequest Service request instance that contains the service to call and its parameters.
  */
  public async CallService(serviceRequest: ServiceCallRequest): Promise<void> {

    try {

      //console.log("%c CallService (hass-service) - Calling service %s (no response)\n%s",
      //  "color: orange;",
      //  JSON.stringify(serviceRequest.service),
      //  JSON.stringify(serviceRequest, null, 2)
      //);

      // show the progress indicator on the main card.
      this.card.dispatchEvent(ProgressStartedEvent(this.section));

      // call the service.
      await this.hass.callService(
        serviceRequest.domain,
        serviceRequest.service,
        serviceRequest.serviceData,
        serviceRequest.target,
      )

    } finally {

      // hide the progress indicator on the main card.
      this.card.dispatchEvent(ProgressEndedEvent());
    }
  }


  async browseMedia(mediaPlayer: MediaPlayer, media_content_type?: string, media_content_id?: string) {
    const mediaPlayerItem = await this.hass.callWS<MediaPlayerItem>({
      type: 'media_player/browse_media',
      entity_id: mediaPlayer.id,
      media_content_id,
      media_content_type,
    });
    //if (this.config.imageUrlsReplaceHttpWithHttps) {
    //  mediaPlayerItem.children = mediaPlayerItem.children?.map((child) => ({
    //    ...child,
    //    thumbnail: child.thumbnail?.replace('http://', 'https://'),
    //  }));
    //}
    return mediaPlayerItem;
  }


  async getRelatedEntities(player: MediaPlayer, ...entityTypes: string[]) {
    return new Promise<HassEntity[]>(async (resolve, reject) => {
      const subscribeMessage = {
        type: 'render_template',
        template: "{{ device_entities(device_id('" + player.id + "')) }}",
      };
      try {
        const unsubscribe = await this.hass.connection.subscribeMessage<TemplateResult>((response) => {
          unsubscribe();
          resolve(
            response.result
              .filter((item: string) => entityTypes.some((type) => item.includes(type)))
              .map((item) => this.hass.states[item]),
          );
        }, subscribeMessage);
      } catch (e) {
        reject(e);
      }
    });
  }
}
