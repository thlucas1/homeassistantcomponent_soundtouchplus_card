// lovelace card imports.
import { css, html } from 'lit';

// our imports.
import { MediaPlayer } from '../model/media-player';
import { CustomImageUrls } from '../types/custom-image-urls';
import { CardConfig } from '../types/card-config';
import { Section } from '../types/section';
import { formatDateEpochSecondsToLocaleString, formatStringProperCase } from './utils';
import { ContentItem, ContentItemParent } from '../types/soundtouchplus/content-item';
import { IMediaBrowserItem } from '../types/imedia-browser-item';

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
  return items.some((item) => item.ContentItem?.ContainerArt || false);
}


/**
 * Searches the configuration custom ImageUrl's collection for a matching title.
 * The item imageUrl is returned if a match is found; otherwise, undefined.
 * 
 * @param collection Configuration customImageUrls collection to search.
 * @param title Title to search for in the collection.
 */
export function getCustomImageUrl(collection: CustomImageUrls | undefined, title: string) {

  //console.log("getCustomImageUrl - title=%s", title);

  // search collection for matching title and return the imageUrl.
  // remove any special characters from the title before comparing.
  // note that we already removed special characters from the collection 
  // in the setConfig() method when the card configuration was loaded.
  for (const itemTitle in collection) {
    //console.log("STPC - getCustomImageUrl():\n%s = itemTitle\n%s = title", JSON.stringify(itemTitle), JSON.stringify(removeSpecialChars(title)));
    if (itemTitle === removeSpecialChars(title)) {
      //console.log("getCustomImageUrl():\ntitle '%s' found in customimageurls\nimageurl = %s", JSON.stringify(itemTitle), JSON.stringify(collection[itemTitle]));
      return collection[itemTitle];
    }
  }

  // if not found then return undefined.
  return undefined;
}


/**
 * Gets the image url that will be displayed in the media browser for items that contain a 
 * ContainerArt attribute.
 * 
 * The image to display is resolved in the following sequence:
 * - configuration `customImageUrls` `title` for matching item name (if one exists).
 * - item ContainerArt value (if one exists).
 * - configuration `customImageUrls` `default` value (if one exists).
 * - hard-coded `default image` data if all else fails.
 * 
 * If the image url is a Home Assistant brands logo, then the brand icon.png image is used instead.
 */
export function getContentItemImageUrl(item: ContentItem | undefined, config: CardConfig, itemsWithImage: boolean, imageUrlDefault: string) {

  //console.log("getContentItemImageUrl - input\n- image_url = %s",
  //  JSON.stringify(item.image_url),
  //);

  // check for a custom imageUrl; if not found, then use the content item image (if supplied).
  let imageUrl = getCustomImageUrl(config.customImageUrls, item?.Name || '') ?? item?.ContainerArt;

  // do we have a custom imageUrl?
  if (!imageUrl) {
    // no - if there are other items with images, then we will use a default image;
    // otherwise, just return undefined so it doesn't insert a default image.
    if (itemsWithImage) {
      imageUrl = config.customImageUrls?.['default'] || imageUrlDefault;
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


/**
 * Converts an mdiIcon path to a url that can be used as a CSS `background-image url()` value.
 * 
 * @param mdi_icon mdi icon to convert.
 */
export function getMdiIconImageUrl(mdi_icon: string): string {

  const mdiImageUrl = '\'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%232196F3" d="' + mdi_icon + '"></path></svg>\'';
  return mdiImageUrl
}


/**
 * Appends IMediaBrowserItem properties to each item in a collection of items
 * that are destined to be displayed in the media browser.
 * 
 * @items Collection of items to display in the media browser.
 * @config CardConfig object that contains card configuration details.
 * @section Current section that is active.
 * @returns The collection of items, with each item containing IMediaListItem arguments that will be used by the media browser.
 */
export function buildMediaBrowserItems(items: ContentItemParent[], config: CardConfig, section: Section) {

  // do ANY of the items have images?
  const itemsWithImage = hasItemsWithImage(items);

  // process all items in the collection.
  return items.map((item) => {

    //console.log("%c buildMediaBrowserItems - media list item:\n%s",
    //  "color: orange;",
    //  JSON.stringify(item),
    //);

    // get image to use as a thumbnail for the item;
    // if no image can be obtained, then use the default.
    const media_browser_thumbnail = getContentItemImageUrl(item.ContentItem, config, itemsWithImage, DEFAULT_MEDIA_IMAGEURL);
    const media_browser_title = item.ContentItem?.Name;
    const media_browser_subtitle = item.ContentItem?.Source;

    // just to keep the compiler happy ...
    if (section == Section.PRESETS) {
    }

    //console.log("%c buildMediaBrowserItems - media browser item:\n%s",
    //  "color: orange;",
    //  JSON.stringify({
    //    ...item,
    //    media_browser_thumbnail,
    //    media_browser_title,
    //    media_browser_subtitle,
    //  }),
    //);

    // append media browser arguments to the item.
    return {
      ...item,
      media_browser_thumbnail,
      media_browser_title,
      media_browser_subtitle,
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
 * @param mediaListLastUpdatedOn Epoch date(in seconds) when the last refresh of the media list took place.  Only used for services that don't have a media player `lastupdatedon` attribute.
 * @param mediaList A media list of content items.
 * @returns The text argument with keywords replaced with the equivalent attribute values.
 */
export function formatTitleInfo(
  text: string | undefined,
  config: CardConfig,
  player: MediaPlayer | undefined = undefined,
  mediaListLastUpdatedOn: number | undefined = undefined,
  mediaList: Array<any> | undefined = undefined,
): string | undefined {

  // call various formatting methods.
  let result = formatConfigInfo(text, config);
  result = formatPlayerInfo(result, player);
  result = formatMediaListInfo(result, mediaListLastUpdatedOn, mediaList);
  return result;
}


/**
 * Formats a string with MediaList information.  This method finds selected keywords
 * and replaces them with the equivalent MediaList attribute values.
 * 
 * @param text Text string to replace keyword values with.
 * @param mediaListLastUpdatedOn Epoch date(in seconds) when the last refresh of the media list took place.  Only used for services that don't have a media player `lastupdatedon` attribute.
 * @param mediaList A media list of content items.
 * @returns The text argument with keywords replaced with media list details.
 */
export function formatMediaListInfo(
  text: string | undefined,
  mediaListLastUpdatedOn: number | undefined = undefined,
  mediaList: Array<any> | undefined = undefined,
): string | undefined {

  // if text not set then don't bother.
  if (!text)
    return text;

  // if media list not set, then use an empty array to resolve to 0 items.
  if (text.indexOf("{medialist.itemcount}") > -1) {
    const count = (mediaList || []).length.toString();
    text = text.replace("{medialist.itemcount}", count);
  }

  if (text.indexOf("{medialist.lastupdatedon}") > -1) {
    const localeDT = formatDateEpochSecondsToLocaleString(mediaListLastUpdatedOn || 0);
    text = text.replace("{medialist.lastupdatedon}", localeDT || '');
  }

  return text;
}


/**
 * Formats a string with MediaPlayer information.  This method finds selected keywords
 * and replaces them with the equivalent MediaPlayer attribute values.
 * 
 * @param text Text string to replace media player keyword values with.
 * @param player MediaPlayer instance that contains information about the player.
 * @returns The text argument with keywords replaced with media player details.
 */
export function formatPlayerInfo(
  text: string | undefined,
  player: MediaPlayer | undefined,
  ): string | undefined {

  // if player instance not set then don't bother.
  if (!player)
    return text;

  // replace keyword parameters with media player equivalents.
  if (text) {

    text = text.replace("{player.name}", player.name);
    text = text.replace("{player.friendly_name}", player.attributes.friendly_name || '');
    text = text.replace("{player.source}", player.attributes.source || '');
    text = text.replace("{player.media_album_name}", player.attributes.media_album_name || '');
    text = text.replace("{player.media_artist}", player.attributes.media_artist || '');
    text = text.replace("{player.media_title}", player.attributes.media_title || '');
    text = text.replace("{player.media_track}", player.attributes.media_track?.toString() || '');
    text = text.replace("{player.state}", player.state || '');

    // drop everything after the first parenthesis.
    if (text.indexOf("{player.source_noaccount}") > -1) {
      let value = player.attributes.source || '';
      const idx = value.indexOf('(');
      if (idx > 0) {
        value = value.substring(0, idx - 1);
      }
      text = text.replace("{player.source_noaccount}", (value || '').trim());
    }

    if (text.indexOf("{player.soundtouchplus_presets_lastupdated}") > -1) {
      const localeDT = formatDateEpochSecondsToLocaleString(player.attributes.soundtouchplus_presets_lastupdated);
      text = text.replace("{player.soundtouchplus_presets_lastupdated}", localeDT || '');
    }

    if (text.indexOf("{player.soundtouchplus_recents_lastupdated}") > -1) {
      const localeDT = formatDateEpochSecondsToLocaleString(player.attributes.soundtouchplus_recents_lastupdated);
      text = text.replace("{player.soundtouchplus_recents_lastupdated}", localeDT || '');
    }

    if (text.indexOf("{player.soundtouchplus_recents_cache_lastupdated}") > -1) {
      const localeDT = formatDateEpochSecondsToLocaleString(player.attributes.soundtouchplus_recents_cache_lastupdated);
      text = text.replace("{player.soundtouchplus_recents_cache_lastupdated}", localeDT || '');
    }

    // other possible keywords:
    //media_duration: 276
    //media_position: 182
    //media_position_updated_at: "2024-04-30T21:32:12.303343+00:00"
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
    //supported_features: 1040319

  }

  return text;
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
 * @returns The text argument with keywords replaced with configuration details.
 */
export function formatConfigInfo(
  text: string | undefined,
  config: CardConfig,
): string | undefined {

  // if config instance not set then don't bother.
  if (!config)
    return text;

  // replace keyword parameters with configuration equivalents.
  if (text) {

    text = text.replace("{config.pandorasourceaccount}", config.pandoraSourceAccount || '');
  }

  return text;
}


/**
 * Style definition used to style a media browser item background image.
 */
export function styleMediaBrowserItemBackgroundImage(thumbnail: string, index: number, section: Section) {

  let bgSize = '100%';
  if (section == Section.SOURCES) {
    bgSize = '50%';
  }

  return html`
    <style>
      .button:nth-of-type(${index + 1}) .thumbnail {
        background-image: url(${thumbnail});
        background-size: ${bgSize};
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


export function renderMediaBrowserItem(
  item: IMediaBrowserItem | any,
  showTitle: boolean = true,
  showSubTitle: boolean = true
) {

  //console.log("%c renderMediaBrowserItem\n- IMediaBrowserItem:\n%s",
  //  "color: orange;",
  //  JSON.stringify(item, null, 2)
  //);

  return html`
    <div class="thumbnail"></div>
    <div class="title" ?hidden=${!showTitle}>
      ${item.media_browser_title}
      <div class="title-source" ?hidden=${!showSubTitle}>${formatStringProperCase(item.media_browser_subtitle || '')}</div>
    </div>
  `;
}
