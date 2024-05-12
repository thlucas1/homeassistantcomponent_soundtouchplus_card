// lovelace card imports.
import { HomeAssistant } from 'custom-card-helpers';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';

// our imports.
import { PROGRESS_DONE, PROGRESS_STARTED, DOMAIN_SOUNDTOUCHPLUS } from '../constants';
import { customEvent } from '../utils/utils';
import { ContentItem } from '../types/soundtouchplus/contentitem';
import { NavigateResponse } from '../types/soundtouchplus/navigateresponse';
import { PresetList } from '../types/soundtouchplus/presetlist';
import { RecentList } from '../types/soundtouchplus/recentlist';
import { SourceList } from '../types/soundtouchplus/sourcelist';
import { Section } from '../types/section';
import { ServiceCallResponse } from '../types/servicecallresponse';

//const LOGPFX = "STPC - services/soundtouchplus-service."


/** SoundTouchPlus custom services provider class. */
export class SoundTouchPlusService {

  /** Home Assistant instance. */
  private readonly hass: HomeAssistant;

  /** Custom card instance. */
  private readonly card: Element;

  /** Currently selected section of the card. */
  private readonly section: Section;


  /**
   * Initializes a new instance of the class.
   * 
   * @param hass HomeAssistant instance.
   * @param card Parent custom card instance.
   * @param section Currently selected section of the card.
   */
  constructor(hass: HomeAssistant, card: Element, section: Section) {

    // initialize storage.
    this.hass = hass;
    this.card = card;
    this.section = section;
  }


  /**
   * Calls the specified SoundTouchPlus service, passing it the specified parameters.
   * 
   * @param serviceRequest Service request instance that contains the service to call and its parameters.
  */
  public async CallService(serviceRequest: ServiceCallRequest): Promise<void> {

    try {

      //console.log("%c" + LOGPFX + "CallService()\n Calling service '%s' (no response)\n%s", "color: orange;", serviceRequest.service, JSON.stringify(serviceRequest,null,2));

      // show the progress indicator on the main card.
      this.card.dispatchEvent(customEvent(PROGRESS_STARTED, { section: this.section }));

      // call the service.
      await this.hass.callService(
        serviceRequest.domain,
        serviceRequest.service,
        serviceRequest.serviceData,
        serviceRequest.target,
      )

    } finally {

      // hide the progress indicator on the main card.
      this.card.dispatchEvent(customEvent(PROGRESS_DONE));
    }
  }


  /**
   * Calls the specified SoundTouchPlus service and returns response data that is generated by the
   * service.  The service is called via a script, as there is currently no way to return service 
   * response data from a call to "hass.callService()" (as of 2024/04/26).
   * 
   * @param serviceRequest Service request instance that contains the service to call and its parameters.
   * @returns Response data, in the form of a Record<string, any> (e.g. dictionary).
  */
  public async CallServiceWithResponse(serviceRequest: ServiceCallRequest): Promise<string> {

    try {

      //console.log("%c" + LOGPFX + "CallServiceWithResponse()\n Calling service '%s' (with response)\n%s", "color: orange;", serviceRequest.service, JSON.stringify(serviceRequest, null, 2));

      // show the progress indicator on the main card.
      this.card.dispatchEvent(customEvent(PROGRESS_STARTED, { section: this.section }));

      // call the service as a script.
      const serviceResponse = await this.hass.connection.sendMessagePromise<ServiceCallResponse>({
        type: "execute_script",
        sequence: [{
          "service": serviceRequest.domain + "." + serviceRequest.service,
          "data": serviceRequest.serviceData,
          "target": serviceRequest.target,
          "response_variable": "service_result"
        },
        {
          "stop": "done",
          "response_variable": "service_result"
        }]
      });

      //console.log(LOGPFX + "CallServiceWithResponse()\n Service Response:\n%s", JSON.stringify(serviceResponse.response));

      // return the service response data or an empty dictionary if no response data was generated.
      return JSON.stringify(serviceResponse.response)

    } finally {

      // hide the progress indicator on the main card.
      this.card.dispatchEvent(customEvent(PROGRESS_DONE));
    }
  }


  /**
   * Retrieves the list of sources defined to the device.
   * 
   * @param entityId Entity ID of the SoundTouchPlus device that will process the request (e.g. "media_player.soundtouch_livingroom").
   * @returns A SourceList object.
  */
  public async GetSourceList(entityId: string): Promise<SourceList> {

    try {

      // create service request.
      const serviceRequest: ServiceCallRequest = {
        domain: DOMAIN_SOUNDTOUCHPLUS,
        service: 'get_source_list',
        serviceData: {
          entity_id: entityId,
        }
      };

      // call the service, and convert the response to a type.
      const response = await this.CallServiceWithResponse(serviceRequest);
      const responseObj = JSON.parse(response) as SourceList

      // set the LastUpdatedOn value to epoch (number of seconds), as the
      // service does not provide this field (but we need it for media list processing).
      responseObj.LastUpdatedOn = Date.now() / 1000
      return responseObj;

    } finally {
    }
  }


  /**
   * Retrieves the list of stored stations from the specified music service(e.g. PANDORA, etc).
   * 
   * @param entityId Entity ID of the SoundTouchPlus device that will process the request (e.g. "media_player.soundtouch_livingroom").
   * @param source Music service source to navigate(e.g. 'PANDORA', etc); the value is case -sensitive, and should normally be UPPER case.
   * @param sourceAccount Music service source account (e.g. the music service user-id). Default is none.
   * @param sortType Sort type used by the Music Service to sort the returned items by; the value is case -sensitive.  valid values are 'stationName' and 'dateCreated'.
   * @returns A NavigateResponse object.
  */
  public async MusicServiceStationList(entityId: string, source: string, sourceAccount: string, sortType: string): Promise<NavigateResponse> {

    try {

      // create service request.
      const serviceRequest: ServiceCallRequest = {
        domain: DOMAIN_SOUNDTOUCHPLUS,
        service: 'musicservice_station_list',
        serviceData: {
          entity_id: entityId,
          source: source,
          source_account: sourceAccount,
          sort_type: sortType,
        }
      };

      // call the service, and convert the response to a type.
      const response = await this.CallServiceWithResponse(serviceRequest);
      const responseObj = JSON.parse(response) as NavigateResponse

      // set the LastUpdatedOn value to epoch (number of seconds), as the
      // service does not provide this field (but we need it for media list processing).
      responseObj.LastUpdatedOn = Date.now() / 1000
      return responseObj;

    } finally {
    }
  }


  /**
   * Play media content from a content item source on a SoundTouch device.
   * 
   * @param entityId Entity ID of the SoundTouchPlus device that will process the request (e.g. "media_player.soundtouch_livingroom").
   * @param contentItem Content item type that contains media content details to play.
  */
  public async PlayContentItem(entityId: string, contentItem: ContentItem | undefined): Promise<void> {

    try {

      // validation.
      if (!contentItem)
        throw new Error("STPC0005 contentItem argument was not supplied to the PlayContentItem service.")

      // create service request.
      const serviceRequest: ServiceCallRequest = {
        domain: DOMAIN_SOUNDTOUCHPLUS,
        service: 'play_contentitem',
        serviceData: {
          entity_id: entityId,
          name: contentItem.Name,
          source: contentItem.Source,
          source_account: contentItem.SourceAccount,
          item_type: contentItem.TypeValue,
          location: contentItem.Location,
          container_art: contentItem.ContainerArt,
          is_presetable: contentItem.IsPresetable,
        }
      };

      // call the service.
      await this.CallService(serviceRequest);

    } finally {
    }
  }


  /**
   * Retrieves the list of presets defined to the device.
   * 
   * @param entityId Entity ID of the SoundTouchPlus device that will process the request (e.g. "media_player.soundtouch_livingroom").
   * @param includeEmptySlots - True to include ALL preset slots (both empty and set); otherwise, False (default) to only include preset slots that have been set.
   * @returns A PresetList object.
  */
  public async PresetList(entityId: string, includeEmptySlots: boolean = true): Promise<PresetList> {

    try {

      // create service request.
      const serviceRequest: ServiceCallRequest = {
        domain: DOMAIN_SOUNDTOUCHPLUS,
        service: 'preset_list',
        serviceData: {
          entity_id: entityId,
          include_empty_slots: includeEmptySlots,
        }
      };

      // call the service, and convert the response to a type.
      const response = await this.CallServiceWithResponse(serviceRequest);
      const responseObj = JSON.parse(response) as PresetList
      return responseObj;

    } finally {
    }
  }


  /**
   * Retrieves the list of recents defined to the device.
   * 
   * @param entityId Entity ID of the SoundTouchPlus device that will process the request (e.g. "media_player.soundtouch_livingroom").
   * @returns A RecentList object.
  */
  public async RecentList(entityId: string): Promise<RecentList> {

    try {

      // create service request.
      const serviceRequest: ServiceCallRequest = {
        domain: DOMAIN_SOUNDTOUCHPLUS,
        service: 'recent_list',
        serviceData: {
          entity_id: entityId,
        }
      };

      // call the service, and convert the response to a type.
      const response = await this.CallServiceWithResponse(serviceRequest);
      const responseObj = JSON.parse(response) as RecentList
      return responseObj;

    } finally {
    }
  }


  /**
   * Simulates the press and release of a key on the SoundTouch device remote control.
   * 
   * @param entityId Entity ID of the SoundTouchPlus device that will process the request (e.g. "media_player.soundtouch_livingroom").
   * @param keyId SoundTouch remote control key identifier (e.g. "PRESET_1", "MUTE", etc).  Note that some keys on the SoundTouch remote control are not sent to the SoundTouch device, and therefore are not supported by this service.
   * @param keyState SoundTouch remote control key state.  Most keys will use 'both' for state; the 'PRESET_n' key ids use 'press' to store a preset, and 'release' to select (or play) a preset.
  */
  public async RemoteKeyPress(entityId: string, keyId: string, keyState: string): Promise<void> {

    try {

      // create service request.
      const serviceRequest: ServiceCallRequest = {
        domain: DOMAIN_SOUNDTOUCHPLUS,
        service: 'remote_keypress',
        serviceData: {
          entity_id: entityId,
          key_id: keyId,
          key_state: keyState,
        }
      };

      // call the service.
      await this.CallService(serviceRequest);

    } finally {
    }
  }
}
