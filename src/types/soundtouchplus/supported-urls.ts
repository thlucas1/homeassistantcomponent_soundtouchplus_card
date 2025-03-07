import { ISupportedUrl } from './supported-url';

/**
 * SoundTouch device SupportedUrls configuration object.
 * 
 * This class contains the attributes and sub-items that represent the
 * supported url's configuration of the device.
 */
export interface ISupportedUrls {

  /** 
   * Date and time (in epoch format) of when the list was last updated.  
   * Note that this attribute does not exist in the service response.  It was added here for convenience.
   */
  LastUpdatedOn?: number;

  /** 
   * Device identifier the configuration information was obtained from.
   */
  device_id?: string;

  /** 
   * List of `SupportedUrl` items. 
   */
  urls?: Array<ISupportedUrl>;

}



/**
* Returns true if the specified url is present in the supported urls list;
* otherwise, false.
* 
* @param url URL to check.
* @returns true if the specified url is present in the supported urls list; otherwise, false.
*/
export function supportedUrlsContainsUrl(
  supportedUrls: ISupportedUrls | undefined,
  url: string
): boolean {

  let result = false;
  if (supportedUrls) {
    url = ("" + url).toLowerCase();
    for (const item of ((supportedUrls as ISupportedUrls).urls || [])) {
      if (item.location?.toLowerCase() == ("/" + url)) {
        result = true;
        break;
      }
    }
  }
  return result;
}
