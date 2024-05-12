import { HomeAssistant } from 'custom-card-helpers';
import { MediaPlayerItem, TemplateResult } from '../types';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';
import { PROGRESS_DONE, PROGRESS_STARTED } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { HassEntity } from 'home-assistant-js-websocket';
import { customEvent } from '../utils/utils';
//import { CardConfig }  from '../types/cardconfig'
import { Section } from '../types/section'

export class HassService {

  /** Home Assistant instance. */
  private readonly hass: HomeAssistant;

  /** Card configuration data. */
  //private readonly config: CardConfig;

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
    //this.config = config;
    this.card = card;
    this.section = section;
  }


  async callMediaService(service: string, inOptions: ServiceCallRequest['serviceData']) {

    try {

      // show the progress indicator on the main card.
      this.card.dispatchEvent(customEvent(PROGRESS_STARTED, { section: this.section }));

      await this.hass.callService('media_player', service, inOptions);

    } finally {

      // hide the progress indicator on the main card.
      this.card.dispatchEvent(customEvent(PROGRESS_DONE));
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
