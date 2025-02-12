// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":media-browser-base");

// lovelace card imports.
import { html, LitElement, TemplateResult } from 'lit';
import { eventOptions, property } from 'lit/decorators.js';
import { styleMap, StyleInfo } from 'lit-html/directives/style-map.js';

// our imports.
import { Store } from '../model/store';
import { CardConfig } from '../types/card-config';
import { Section } from '../types/section';
import { ITEM_SELECTED, ITEM_SELECTED_WITH_HOLD } from '../constants';
import { closestElement, customEvent, formatStringProperCase, isTouchDevice } from '../utils/utils';
import { getContentItemImageUrl, hasMediaItemImages } from '../utils/media-browser-utils';
import { IMediaBrowserInfo, IMediaBrowserItem } from '../types/media-browser-item';
import { INavigateItem } from '../types/soundtouchplus/navigate-item';
import { IUserPreset } from '../types/soundtouchplus/user-preset';
import { IRecent } from '../types/soundtouchplus/recent';
import { IPreset } from '../types/soundtouchplus/preset';
import { IContentItemParent } from '../types/soundtouchplus/content-item';

const DEFAULT_MEDIA_IMAGEURL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw1AUhU9TS0UqDnYQcchQnexiRXQrVSyChdJWaNXB5KV/0KQhSXFxFFwLDv4sVh1cnHV1cBUEwR8QZwcnRRcp8b6k0CLGC4/3cd49h/fuA4RWjalmXxxQNcvIJBNivrAqBl8RgA8hxDAnMVNPZRdz8Kyve+qluovyLO++P2tQKZoM8InEcaYbFvEG8cympXPeJw6ziqQQnxNPGnRB4keuyy6/cS47LPDMsJHLzBOHicVyD8s9zCqGSjxNHFFUjfKFvMsK5y3Oaq3BOvfkLwwVtZUs12mNIYklpJCGCBkNVFGDhSjtGikmMnSe8PCPOv40uWRyVcHIsYA6VEiOH/wPfs/WLMWm3KRQAgi82PbHOBDcBdpN2/4+tu32CeB/Bq60rr/eAmY/SW92tcgRMLQNXFx3NXkPuNwBRp50yZAcyU9LKJWA9zP6pgIwfAsMrLlz65zj9AHI0ayWb4CDQ2CiTNnrHu/u753bvz2d+f0A+AZy3KgprtwAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfoBQEMNhNCJ/KVAAACg0lEQVR42u3BgQAAAADDoPlTX+EAVQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwG/GFwABsN92WwAAAABJRU5ErkJggg==';


export class MediaBrowserBase extends LitElement {

  // public state properties.
  @property({ attribute: false }) protected store!: Store;
  @property({ attribute: false }) protected items!: any[];
  @property({ attribute: false }) protected searchMediaType!: any;

  protected config!: CardConfig;
  protected section!: Section;
  protected mousedownTimestamp!: number;
  protected touchstartScrollTop!: number;

  protected hideTitle!: boolean;
  protected hideSubTitle!: boolean;
  protected isTouchDevice!: boolean;
  protected itemsHaveImages!: boolean;
  protected itemsPerRow!: number;
  protected mediaItemType!: any;
  protected listItemClass!: string;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super();

    // initialize storage.
    this.mousedownTimestamp = 0;
    this.touchstartScrollTop = 0;

  }


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // set common references from application common storage area.
    this.config = this.store.config;
    this.section = this.store.section;

    // set title / source visibility based on selected section.
    this.hideTitle = true;
    this.hideSubTitle = true;
    this.itemsPerRow = 2;
    this.listItemClass = 'button';

    // do ANY of the items have images?  returns true if so, otherwise false.
    this.itemsHaveImages = hasMediaItemImages(this.items || []);

    // assign the mediaItemType based on the section value.
    this.mediaItemType = this.section;

    // set item control properties from configuration settings.
    if (this.mediaItemType == Section.PANDORA_STATIONS) {
      this.itemsPerRow = this.config.pandoraBrowserItemsPerRow || 4;
      this.hideTitle = this.config.pandoraBrowserItemsHideTitle || false;
      this.hideSubTitle = true;
    } else if (this.mediaItemType == Section.PRESETS) {
      this.itemsPerRow = this.config.presetBrowserItemsPerRow || 3;
      this.hideTitle = this.config.presetBrowserItemsHideTitle || false;
      this.hideSubTitle = this.config.presetBrowserItemsHideSubTitle || false;
    } else if (this.mediaItemType == Section.RECENTS) {
      this.itemsPerRow = this.config.recentBrowserItemsPerRow || 4;
      this.hideTitle = this.config.recentBrowserItemsHideTitle || false;
      this.hideSubTitle = this.config.recentBrowserItemsHideSubTitle || false;
    } else if (this.mediaItemType == Section.SOURCES) {
      this.itemsPerRow = this.config.sourceBrowserItemsPerRow || 1;
      this.hideTitle = this.config.sourceBrowserItemsHideTitle || false;
      this.hideSubTitle = true;
      // for sources, make the source icons half the size of regular list buttons.
      this.listItemClass += ' button-device';
    } else if (this.mediaItemType == Section.USERPRESETS) {
      this.itemsPerRow = this.config.userPresetBrowserItemsPerRow || 4;
      this.hideTitle = this.config.userPresetBrowserItemsHideTitle || false;
      this.hideSubTitle = this.config.userPresetBrowserItemsHideSubTitle || false;
    }

    // all html is rendered in the inheriting class.
  }


  /**
   * Returns a style map for media browser item theming.
   */
  protected styleMediaBrowser() {

    // load card configuration theme settings.
    const mediaBrowserItemsColor = this.config.mediaBrowserItemsColor;
    const mediaBrowserItemsListColor = this.config.mediaBrowserItemsListColor;
    const mediaBrowserItemsSvgIconColor = this.config.mediaBrowserItemsSvgIconColor;
    const mediaBrowserItemsTitleFontSize = this.config.mediaBrowserItemsTitleFontSize;
    const mediaBrowserItemsSubTitleFontSize = this.config.mediaBrowserItemsSubTitleFontSize;

    // build style info object.
    const styleInfo: StyleInfo = <StyleInfo>{};
    styleInfo['--items-per-row'] = `${this.itemsPerRow}`;
    if (mediaBrowserItemsColor)
      styleInfo['--stpc-media-browser-items-color'] = `${mediaBrowserItemsColor}`;
    if (mediaBrowserItemsListColor)
      styleInfo['--stpc-media-browser-items-list-color'] = `${mediaBrowserItemsListColor}`;
    if (mediaBrowserItemsSvgIconColor)
      styleInfo['--stpc-media-browser-items-svgicon-color'] = `${mediaBrowserItemsSvgIconColor}`;
    if (mediaBrowserItemsTitleFontSize)
      styleInfo['--stpc-media-browser-items-title-font-size'] = `${mediaBrowserItemsTitleFontSize}`;
    if (mediaBrowserItemsSubTitleFontSize)
      styleInfo['--stpc-media-browser-items-subtitle-font-size'] = `${mediaBrowserItemsSubTitleFontSize}`;
    return styleMap(styleInfo);
  }


  /**
   * Invoked when the component is added to the document's DOM.
   *
   * In `connectedCallback()` you should setup tasks that should only occur when
   * the element is connected to the document. The most common of these is
   * adding event listeners to nodes external to the element, like a keydown
   * event handler added to the window.
   */
  public connectedCallback() {

    // invoke base class method.
    super.connectedCallback();

    // is touch support disabled?
    if (this.store.config.touchSupportDisabled || false) {
      this.isTouchDevice = false;
      debuglog("connectedCallback - touch supported events are disabled via card configuration\n- isTouchDevice=%s",
        JSON.stringify(this.isTouchDevice)
      );
    } else {
      // determine if this is a touch device (true) or not (false).
      this.isTouchDevice = isTouchDevice();
      debuglog("connectedCallback - touch supported events are enabled programatically\n- isTouchDevice=%s",
        JSON.stringify(this.isTouchDevice)
      );
    }

    if (this.isTouchDevice) {
      // for touch devices, prevent context menu from showing when user ends the touch.
      this.addEventListener('touchend', function (e) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  }


  /**
   * Event fired when a mouseup event takes place for a media browser 
   * item button.
   * 
   * This event is NOT fired for touch devices.
   * 
   * @param event Event arguments.
   */
  protected onMediaBrowserItemClick(event: CustomEvent): boolean {

    // have we already fired the click event?
    if (this.mousedownTimestamp == -1) {
      return true;
    }

    // calculate the duration of the mouse down / up operation.
    // we are looking to determine how long the mouse button was in the down
    // position (e.g.the duration).  if the duration was greater than 1.0 seconds,
    // then we will treat the event as a "click and hold" operation; otherwise,
    // we will treat the event as a "click" operation.
    const duration = Date.now() - this.mousedownTimestamp;
    this.mousedownTimestamp = -1;

    if (duration < 1000) {
      return this.dispatchEvent(customEvent(ITEM_SELECTED, event.detail));
    } else {
      return this.dispatchEvent(customEvent(ITEM_SELECTED_WITH_HOLD, event.detail));
    }

  }


  /**
   * Event fired when a mousedown event takes place for a media browser 
   * item button.
   * 
   * This event is NOT fired for touch devices.
   * 
   * The `@eventOptions` will prevent the following warning messages in Chrome:
   * [Violation] Added non-passive event listener to a scroll-blocking <some> event. 
   * Consider marking event handler as 'passive' to make the page more responsive.
   * This will tell browsers that `preventDefault()` will never be called on those 
   * events, which will increase performance as well as remove the warning message.
   */
  protected onMediaBrowserItemMouseDown(): boolean {

    // store the current time (in milliseconds) so that we can calculate
    // the duration in the "click" event (occurs after a mouseup event).
    this.mousedownTimestamp = Date.now();

    // automatically fire the click event in 1100 milliseconds.
    // we will handle any duplicate click event in the click event handler.
    setTimeout(() => {
      this.shadowRoot?.activeElement?.dispatchEvent(new Event('click'));
    }, 1100);

    return true;
  }


  /**
   * Event fired when a mouseup event takes place for a media browser 
   * item button.
   * 
   * This event is NOT fired for touch devices.
   * 
   * @param event Event arguments.
   */
  protected onMediaBrowserItemMouseUp(event: CustomEvent): boolean {

    // have we already fired the click event?
    if (this.mousedownTimestamp == -1) {
      return true;
    }

    // calculate the duration of the mouse down / up operation.
    // we are looking to determine how long the mouse button was in the down
    // position (e.g.the duration).  if the duration was greater than 1.0 seconds,
    // then we will treat the event as a "click and hold" operation; otherwise,
    // we will treat the event as a "click" operation.
    const duration = Date.now() - this.mousedownTimestamp;
    this.mousedownTimestamp = -1;

    if (duration < 1000) {
      return this.dispatchEvent(customEvent(ITEM_SELECTED, event.detail));
    } else {
      return this.dispatchEvent(customEvent(ITEM_SELECTED_WITH_HOLD, event.detail));
    }

  }


  /**
   * Event fired when a touchstart event takes place for a media browser 
   * item button.
   * 
   * This event is NOT fired for non-touch devices (e.g. mouse).
   * 
   * @param event Event arguments.
   * 
   * The event listener expression `{handleEvent: () => ... , passive: true }` syntax 
   * is used to set passive to true on the `addEventHandler` definition.  Using this
   * syntax prevents the `[Violation] Added non-passive event listener to a scroll-blocking 
   * <some> event. Consider marking event handler as 'passive' to make the page more 
   * responsive` warnings that are generated by Chrome and other browsers.  These
   * warnings only seem to appear for the `touchstart`, `touchmove`, and `scroll`
   * declarative events.
   * 
   * Note that the `@eventOptions({ passive: true })` has no effect when using a `() =>`
   * event expression on the declarative event listener!  We left it here though, just
   * in case we change the event listener expression in the future.
   */
  @eventOptions({ passive: true })
  protected onMediaBrowserItemTouchStart(event: CustomEvent): boolean {

    // store the current time (in milliseconds) so that we can calculate
    // the duration in the "click" event (occurs after a mouseup event).
    this.mousedownTimestamp = Date.now();

    // find the parent `mediaBrowserContentElement` and get the scroll position.
    // for touch devices, we need to determine if the touchstart / touchend
    // events are for scrolling or tap and hold.
    const divContainer = closestElement('#mediaBrowserContentElement', this) as HTMLDivElement;
    if (divContainer) {
      this.touchstartScrollTop = divContainer.scrollTop;
    }

    // fire the following logic in 1100 milliseconds (1.1 seconds) that will determine 
    // if a press-and-hold action took place (versus a press action).
    setTimeout(() => {

      // if a press action took place, then we are done.
      if (this.mousedownTimestamp == -1) {
        return;
      }

      // find the parent `mediaBrowserContentElement` and get the current scroll position.
      // for touch devices, we need to determine if the user is scrolling or if they
      // want to issue a press / press-and-hold action.
      // we do this by comparing the scroll position of the parent container when the touch
      // was initiated to the current scroll position.
      // if original and current scroll positions are not equal (or nearly so), then it's a 
      // scroll operation and we can ignore the event.
      const divContainer = closestElement('#mediaBrowserContentElement', this) as HTMLDivElement;
      let scrollTopDifference = 0;
      if (divContainer) {
        scrollTopDifference = this.touchstartScrollTop - divContainer.scrollTop;
        if (scrollTopDifference != 0) {
          return;
        }
      }

      // at this point, we know it's a press-and-hold action.
      // dispatch the ITEM_SELECTED_WITH_HOLD event, and reset timestamp to indicate it was handled.
      this.mousedownTimestamp = -1;
      return this.dispatchEvent(customEvent(ITEM_SELECTED_WITH_HOLD, event.detail));

    }, 1100);

    return true;
  }


  /**
   * Event fired when a touchend event takes place for a media browser 
   * item button.
   * 
   * This event is NOT fired for non-touch devices (e.g. mouse).
   * 
   * @param event Event arguments.
   * 
   * The `@eventOptions` will prevent the following warning messages in Chrome:
   * [Violation] Added non-passive event listener to a scroll-blocking <some> event. 
   * Consider marking event handler as 'passive' to make the page more responsive.
   * This will tell browsers that `preventDefault()` will never be called on those 
   * events, which will increase performance as well as remove the warning message.
   */
  protected onMediaBrowserItemTouchEnd(event: CustomEvent): boolean {

    // have we already fired the click event?
    if (this.mousedownTimestamp == -1) {
      return true;
    }

    // find the parent `mediaBrowserContentElement` and get the scroll position.
    // for touch devices, we need to determine if the touchstart / touchend
    // events are for scrolling or tap and hold.
    const divContainer = closestElement('#mediaBrowserContentElement', this) as HTMLDivElement;
    let scrollTopDifference = 0;
    if (divContainer) {
      scrollTopDifference = this.touchstartScrollTop - divContainer.scrollTop;

      // if scroll positions are not equal (or nearly so), then it's a scroll
      // operation and we can ignore the event.
      if (scrollTopDifference != 0) {
        return true;
      }
    }

    // calculate the duration of the mouse down / up operation.
    // we are looking to determine how long the mouse button was in the down
    // position (e.g.the duration).  if the duration was greater than 1.0 seconds,
    // then we will treat the event as a "click and hold" operation; otherwise,
    // we will treat the event as a "click" operation.
    const duration = Date.now() - this.mousedownTimestamp;
    this.mousedownTimestamp = -1;

    if (duration < 1000) {
      return this.dispatchEvent(customEvent(ITEM_SELECTED, event.detail));
    } else {
      return this.dispatchEvent(customEvent(ITEM_SELECTED_WITH_HOLD, event.detail));
    }

  }


  /**
   * Style definition used to style a media browser item background image.
   */
  protected styleMediaBrowserItemBackgroundImage(thumbnail: string, index: number) {

    let bgSize = '100%';
    if (this.section == Section.SOURCES) {
      bgSize = '50%';
    }

    // if thumbnail contains an svg icon, then use a mask; otherwise, use a background-image.
    // this allows the user to theme the svg icon color.
    if (thumbnail.includes("svg+xml")) {
      return html`
      <style>
        .button:nth-of-type(${index + 1}) .thumbnail {
          mask-image: url(${thumbnail});
          mask-size: ${bgSize};
          background-color: var(--stpc-media-browser-items-svgicon-color, #2196F3);
        }
      </style>
    `;
    } else {
      return html`
      <style>
        .button:nth-of-type(${index + 1}) .thumbnail {
          background-image: url(${thumbnail});
          background-size: ${bgSize};
          background-color: var(--stpc-media-browser-items-svgicon-color, transparent);
        }
      </style>
    `;
    }
  }


  /**
   * Appends IMediaBrowserItem properties to each item in a collection of items
   * that are destined to be displayed in the media browser.
   * 
   * @returns The collection of items, with each item containing IMediaListItem arguments that will be used by the media browser.
   */
  protected buildMediaBrowserItems() {

    // process all items in the collection.
    return (this.items || []).map((item) => {

      //console.log("%c buildMediaBrowserItems - media list item:\n%s",
      //  "color: yellow;",
      //  JSON.stringify(item),
      //);

      // build media browser info item, that will be merged with the base item.
      // get image to use as a thumbnail for the item;
      // if no image can be obtained, then use the default.
      const mbi_info: IMediaBrowserInfo = {
        image_url: getContentItemImageUrl(item, this.config, this.itemsHaveImages, DEFAULT_MEDIA_IMAGEURL),
        title: item.ContentItem.Name,
        subtitle: item.ContentItem.Source,
        is_active: false,
      };

      // modify subtitle value based on selected section type.
      if (this.mediaItemType == Section.PANDORA_STATIONS) {
        const itemInfo = (item as INavigateItem);
        mbi_info.subtitle = itemInfo.ContentItem?.Location || item.ContentItem.Source;
      } else if (this.mediaItemType == Section.PRESETS) {
        const itemInfo = (item as IPreset);
        mbi_info.subtitle = formatStringProperCase(itemInfo.ContentItem?.Source || "");
      } else if (this.mediaItemType == Section.RECENTS) {
        const itemInfo = (item as IRecent);
        mbi_info.subtitle = formatStringProperCase(itemInfo.ContentItem?.Source || "");
      } else if (this.mediaItemType == Section.SOURCES) {
        // for source item, we will also indicate which device is active.
        const itemInfo = (item as IContentItemParent);
        mbi_info.is_active = (itemInfo.ContentItem?.Name == this.store.player.attributes.source);
      } else if (this.mediaItemType == Section.USERPRESETS) {
        const itemInfo = (item as IUserPreset);
        mbi_info.subtitle = itemInfo.ContentItem?.Source || item.ContentItem.Source;
      } else if (this.mediaItemType == Section.PLAYER) {
        // this condition can be ignored, as the player does not contain a media-browser.
      } else {
        console.log("%cmedia-browser-utils - unknown mediaItemType = %s; mbi_info not set!", "color:red", JSON.stringify(this.mediaItemType));
      }

      //console.log("%c buildMediaBrowserItems - media browser item:\n%s",
      //  "color: yellow;",
      //  JSON.stringify({
      //    ...item,
      //    mbi_item: mbi_info,
      //  }),
      //);

      // append media browser item arguments to the item.
      return {
        ...item,
        mbi_item: mbi_info
      };
    });
  }


  protected renderMediaBrowserItem(
    item: IMediaBrowserItem,
    showTitle: boolean = true,
    showSubTitle: boolean = true,
  ) {

    let clsActive = ''
    if (item.mbi_item.is_active) {
      clsActive = ' title-active';
    }

    return html`
      <div class="thumbnail"></div>
      <div class="title${clsActive}" ?hidden=${!showTitle}>
        ${item.mbi_item.title}
        <div class="subtitle" ?hidden=${!showSubTitle}>${formatStringProperCase(item.mbi_item.subtitle || '')}</div>
      </div>
    `;
  }

}
