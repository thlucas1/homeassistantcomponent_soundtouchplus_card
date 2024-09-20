/**
 * Media Browser display item.
 */

export interface IMediaBrowserItem {

  /**
   * Image url that will be displayed as the background image.
   */
  media_browser_thumbnail: string;


  /**
   * Title value.
   */
  media_browser_title: string | null;


  /**
   * Sub-Title value.
   */
  media_browser_subtitle: string | null;

}
