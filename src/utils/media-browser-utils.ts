// lovelace card imports.
import { css, html } from 'lit';

// our imports.
import { MediaPlayer } from '../model/media-player';
import { CustomImageUrls } from '../types/customimageurls'
import { CardConfig } from '../types/cardconfig'
import { ContentItem, ContentItemParent } from '../types/soundtouchplus/contentitem';
import { formatDateEpochSecondsToLocaleString, formatStringProperCase } from './utils';

const DEFAULT_MEDIA_IMAGEURL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw1AUhU9TS0UqDnYQcchQnexiRXQrVSyChdJWaNXB5KV/0KQhSXFxFFwLDv4sVh1cnHV1cBUEwR8QZwcnRRcp8b6k0CLGC4/3cd49h/fuA4RWjalmXxxQNcvIJBNivrAqBl8RgA8hxDAnMVNPZRdz8Kyve+qluovyLO++P2tQKZoM8InEcaYbFvEG8cympXPeJw6ziqQQnxNPGnRB4keuyy6/cS47LPDMsJHLzBOHicVyD8s9zCqGSjxNHFFUjfKFvMsK5y3Oaq3BOvfkLwwVtZUs12mNIYklpJCGCBkNVFGDhSjtGikmMnSe8PCPOv40uWRyVcHIsYA6VEiOH/wPfs/WLMWm3KRQAgi82PbHOBDcBdpN2/4+tu32CeB/Bq60rr/eAmY/SW92tcgRMLQNXFx3NXkPuNwBRp50yZAcyU9LKJWA9zP6pgIwfAsMrLlz65zj9AHI0ayWb4CDQ2CiTNnrHu/u753bvz2d+f0A+AZy3KgprtwAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfoBQEMNhNCJ/KVAAACg0lEQVR42u3BgQAAAADDoPlTX+EAVQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwG/GFwABsN92WwAAAABJRU5ErkJggg==';


/**
 * Removes all special characters from a string, so that it can be used
 * for comparison operations.
 * 
 * @param str String value to remove special characters from.
 * @returns The `str` value without special characters.
 */
export function removeSpecialChars(str: string) {
  let value = str.replace(/[^a-zA-Z ]/g, '');
  if (value)
    value = value.trim();
  return value;
}


function hasItemsWithImage(items: ContentItemParent[]) {
  return items.some((item) => item.ContentItem?.ContainerArt);
}


/**
 * Searches the configuration custom ImageUrl's collection for a matching title.
 * The item imageUrl is returned if a match is found; otherwise, undefined.
 * 
 * @param collection Configuration customImageUrls collection to search.
 * @param title Title to search for in the collection.
 */
export function getCustomImageUrl(collection: CustomImageUrls | undefined, title: string) {

  // search collection for matching title and return the imageUrl.
  // remove any special characters from the title before comparing.
  // note that we already removed special characters from the collection 
  // in the setConfig() method when the card configuration was loaded.
  for (const itemTitle in collection) {
    //console.log("STPC - getCustomImageUrl():\n%s = itemTitle\n%s = title", JSON.stringify(itemTitle), JSON.stringify(removeSpecialChars(title)));
    if (itemTitle === removeSpecialChars(title)) {
      //console.log("STPC - getCustomImageUrl():\ntitle '%s' found in customimageurls\nimageurl = %s", JSON.stringify(itemTitle), JSON.stringify(collection[itemTitle]));
      return collection[itemTitle];
    }
  }

  // if not found then return undefined.
  return undefined;
}


/**
 * Gets the image url that will be displayed in the media browser.  
 * 
 * The image to display is resolved in the following sequence:
 * - configuration `customImageUrls` `title` for matching contentItem name (if one exists).
 * - contentItem ContainerArt value (if one exists).
 * - configuration `customImageUrls` `default` value (if one exists).
 * - hard-coded `default image` data if all else fails.
 * 
 * If the image url is a Home Assistant brands logo, then the brand icon.png image is used instead.
 */
export function getContentItemImageUrl(contentItem: ContentItem | undefined, config: CardConfig, itemsWithImage: boolean) {

  // check for a custom imageUrl; if not found, then use the content item image (if supplied).
  let imageUrl = getCustomImageUrl(config.customImageUrls, contentItem?.Name || '') ?? contentItem?.ContainerArt;

  // do we have a custom imageUrl?
  if (!imageUrl) {

    // if there are other items with images, then we will use a default image;
    // otherwise, just return undefined so it doesn't insert a default image.
    if (itemsWithImage) {
      imageUrl = config.customImageUrls?.['default'] || DEFAULT_MEDIA_IMAGEURL;
    }
  }

  // if imageUrl is a home assistant brands logo, then use the 'icon.png' image.
  if (imageUrl?.match(/https:\/\/brands\.home-assistant\.io\/.+\/logo.png/)) {
    imageUrl = imageUrl?.replace('logo.png', 'icon.png');
  }

  //console.log("STPC - getContentItemImageUrl():\nfinal imageurl = %s", JSON.stringify(imageUrl));

  // return imageUrl to caller.
  return imageUrl || '';
}


export function itemsWithFallbacks(collection: ContentItemParent[], config: CardConfig) {
  const itemsWithImage = hasItemsWithImage(collection);
  return collection.map((item) => {
    const thumbnail = getContentItemImageUrl(item.ContentItem, config, itemsWithImage);
    return {
      ...item,
      thumbnail,
    };
  });
}


/**
 * Formats a string with various configuration information.  This method finds selected keywords
 * and replaces them with the equivalent attribute values.
 * 
 * @param text Text string to replace keyword values with.
 * @param config CardConfig configuration data.
 * @param player MediaPlayer instance that contains information about the player.
 * @param lastUpdatedOn Epoch date (in seconds) when the last refresh of the media list took place.  Only used for services that don't have a media player `lastupdatedon` attribute.
 * @returns The text argument with keywords replaced with the equivalent attribute values.
 */
export function formatTitleInfo(
  text: string | undefined,
  config: CardConfig,
  player: MediaPlayer,
  lastUpdatedOn: number | undefined = undefined,
): string | undefined {

  // call various formatting methods.
  let result = formatConfigInfo(text, config);
  result = formatPlayerInfo(result, player, lastUpdatedOn);
  return result;

}

/**
 * Formats a string with MediaPlayer information.  This method finds selected keywords
 * and replaces them with the equivalent MediaPlayer attribute values.
 * 
 * The following replacement keywords are supported:
 * - {player.name} : player name (e.g. "Livingroom Soundbar").
 * - {player.soundtouchplus_presets_lastupdated} : Date and Time the preset list was last refreshed from the device.
 * - {player.soundtouchplus_recents_lastupdated} : Date and Time the recents list was last refreshed from the device.
 * 
 * @param text Text string to replace media player keyword values with.
 * @param player MediaPlayer instance that contains information about the player.
 * @param lastUpdatedOn Epoch date (in seconds) when the last refresh of the media list took place.  Only used for services that don't have a media player `lastupdatedon` attribute.
 * @returns The text argument with media player keywords replaced with media player details.
 */
export function formatPlayerInfo(
  text: string | undefined,
  player: MediaPlayer,
  lastUpdatedOn: number | undefined = undefined,
  ): string | undefined {

  // if player instance not set then don't bother.
  if (!player)
    return text

  // replace keyword parameters with media player equivalents.
  if (text) {

    text = text.replace("{player.name}", player.name);
    text = text.replace("{player.source}", player.attributes.source || '');

    if (text.indexOf("{player.soundtouchplus_presets_lastupdated}") > -1) {
      const localeDT = formatDateEpochSecondsToLocaleString(player.attributes.soundtouchplus_presets_lastupdated)
      text = text.replace("{player.soundtouchplus_presets_lastupdated}", localeDT || '');
    }

    if (text.indexOf("{player.soundtouchplus_recents_lastupdated}") > -1) {
      const localeDT = formatDateEpochSecondsToLocaleString(player.attributes.soundtouchplus_presets_lastupdated)
      text = text.replace("{player.soundtouchplus_recents_lastupdated}", localeDT || '');
    }

    if ((lastUpdatedOn || 0) > 0) {
      if (text.indexOf("{lastupdatedon}") > -1) {
        const localeDT = formatDateEpochSecondsToLocaleString(lastUpdatedOn || 0)
        text = text.replace("{lastupdatedon}", localeDT || '');
      }
    }

    // other possible keywords:
    //media_duration: 276
    //media_position: 182
    //media_position_updated_at: "2024-04-30T21:32:12.303343+00:00"
    //media_title: Redeemed
    //media_artist: Big Daddy Weave
    //media_album_name: Love Come To Life
    //media_track: Redeemed
    //shuffle: false
    //repeat: "off"
    //soundtouchplus_nowplaying_isadvertisement: false
    //soundtouchplus_nowplaying_isfavorite: true
    //soundtouchplus_source: SPOTIFY: 31l77y2al5lnn7mxfrmd4bpfhqke
    //soundtouchplus_sound_mode: not capable
    //soundtouchplus_tone_bass_level: not capable
    //soundtouchplus_tone_treble_level: not capable
    //device_class: speaker
    //entity_picture: > -
    //  /api/media_player_proxy / media_player.bose_st10_1 ? token = f447f9b3fbdb647d9df2f7b0a5a474be9e17ffa51d26eb18f414d5120a2bdeb8 & cache=2a8a6a76b27e209a
    //icon: mdi: speaker
    //friendly_name: Bose - ST10 - 1
    //supported_features: 1040319

  }

  return text
}


/**
 * Formats a string with CardConfig information.  This method finds selected keywords
 * and replaces them with the equivalent CardConfig attribute values.
 * 
 * The following replacement keywords are supported:
 * - {config.pandoraUserAccount} : player name (e.g. "Livingroom Soundbar").
 * 
 * @param text Text string to replace configuration keyword values with.
 * @param config CardConfig configuration data.
 * @returns The text argument with configuration keywords replaced with configuration details.
 */
export function formatConfigInfo(
  text: string | undefined,
  config: CardConfig,
): string | undefined {

  // if config instance not set then don't bother.
  if (!config)
    return text

  // replace keyword parameters with configuration equivalents.
  if (text) {

    text = text.replace("{config.pandorasourceaccount}", config.pandoraSourceAccount || '');

  }

  return text
}


/**
 * Style definition used to style a media browser item background image.
 */
export function styleMediaBrowserItemBackgroundImage(thumbnail: string, index: number) {
  return html`
    <style>
      .button:nth-of-type(${index + 1}) .thumbnail {
        background-image: url(${thumbnail});
      }
    </style>
  `;
}


/**
 * Style definition used to style a media browser item title.
 */
export const styleMediaBrowserItemTitle = css`
  .title {
    color: var(--secondary-text-color);
    font-weight: normal;
    padding: 0 0.5rem;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
`;


export function renderMediaBrowserContentItem(contentItem: ContentItem | undefined, showTitle = true, showSource = true) {
  return html`
    <div class="thumbnail"></div>
    <div class="title" ?hidden=${!showTitle}>
      ${contentItem?.Name}
      <div class="title-source" ?hidden=${!showSource}>${formatStringProperCase(contentItem?.Source || '')}</div>
    </div>
  `;
  // <div class="thumbnail"></div>
  // <div class="thumbnail" ?hidden=${!contentItem.ContentItem?.ContainerArt}></div>
}
