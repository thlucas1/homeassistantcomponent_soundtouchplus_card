// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

// our imports.
import { Store } from '../model/store';
import { CardConfig } from '../types/card-config';
import { Section } from '../types/section';
import { ContentItemParent } from '../types/soundtouchplus/content-item';
import { ITEM_SELECTED, ITEM_SELECTED_WITH_HOLD } from '../constants';
import { customEvent } from '../utils/utils';
import {
  buildMediaBrowserItems,
  renderMediaBrowserItem,
  styleMediaBrowserItemBackgroundImage,
  styleMediaBrowserItemTitle
} from '../utils/media-browser-utils';

export class MediaBrowserIcons extends LitElement {

  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) items!: ContentItemParent[];

  @state() mousedownTimestamp!: number;

  private config!: CardConfig;
  private section!: Section;

  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super();

    // initialize storage.
    this.mousedownTimestamp = 0;
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
    let hideTitle = true;
    let hideSubTitle = true;
    let itemsPerRow = 1;
    if (this.section == Section.PANDORA_STATIONS) {
      itemsPerRow = this.config.pandoraBrowserItemsPerRow || 3;
      hideTitle = this.config.pandoraBrowserItemsHideTitle || false;
      hideSubTitle = true;
    } else if (this.section == Section.PRESETS) {
      itemsPerRow = this.config.presetBrowserItemsPerRow || 3;
      hideTitle = this.config.presetBrowserItemsHideTitle || false;
      hideSubTitle = this.config.presetBrowserItemsHideSource || false;
    } else if (this.section == Section.RECENTS) {
      itemsPerRow = this.config.recentBrowserItemsPerRow || 3;
      hideTitle = this.config.recentBrowserItemsHideTitle || false;
      hideSubTitle = this.config.recentBrowserItemsHideSource || false;
    } else if (this.section == Section.SOURCES) {
      itemsPerRow = this.config.sourceBrowserItemsPerRow || 3;
      hideTitle = this.config.sourceBrowserItemsHideTitle || false;
      hideSubTitle = true;
    } else if (this.section == Section.USERPRESETS) {
      itemsPerRow = this.config.userPresetBrowserItemsPerRow || 3;
      hideTitle = this.config.userPresetBrowserItemsHideTitle || false;
      hideSubTitle = this.config.userPresetBrowserItemsHideSource || false;
    }

    //console.log("%c render (media-browser-icons)\n Section %s items:\n%s",
    //  "color: orange;",
    //  JSON.stringify(this.section),
    //  JSON.stringify(this.items, null, 2),
    //);

    return html`
      <style>
        :host {
          --items-per-row: ${itemsPerRow};
        }
      </style>
      <div class="icons">
        ${buildMediaBrowserItems(this.items || [], this.config, this.section).map(
          (item, index) => html`
            ${styleMediaBrowserItemBackgroundImage(item.media_browser_thumbnail, index, this.section)}
            <ha-control-button
              class="button"
              @click=${() => this.buttonMediaBrowserItemClick(customEvent(ITEM_SELECTED, item))}
              @mousedown=${() => this.buttonMediaBrowserItemMouseDown()}
            >
              ${renderMediaBrowserItem(item, !item.media_browser_thumbnail || !hideTitle, !hideSubTitle)}
            </ha-control-button>
          `,
        )}
      </div>
    `;
  }


  /**
   * Style definitions used by this card section.
   * 
   * --control-button-padding: 0px;   // image with rounded corners
   */
  static get styles() {
    return [
      styleMediaBrowserItemTitle,
      css`
        .icons {
          display: flex;
          flex-wrap: wrap;
        }

        .button {
          --control-button-padding: 0px;
          --margin: 0.6%;
          --width: calc(100% / var(--items-per-row) - (var(--margin) * 2));
          width: var(--width);
          height: var(--width);
          margin: var(--margin);
        }

        .thumbnail {
          width: 100%;
          padding-bottom: 100%;
          margin: 0 6%;
          background-size: 100%;
          background-repeat: no-repeat;
          background-position: center;
        }

        .title {
          font-size: 0.8rem;
          position: absolute;
          width: 100%;
          line-height: 160%;
          bottom: 0;
          background-color: rgba(var(--rgb-card-background-color), 0.733);
        }

        .title-source {
          font-size: 0.8rem;
          width: 100%;
          line-height: 160%;
        }
      `,
    ];
  }


  /**
   * Event fired when a mousedown event takes place for a media browser item button.
   * In this case, we will store the current time (in milliseconds) so that we can calculate
   * the duration in the "click" event (occurs after a mouseup event).
   * 
   * @param event Event arguments.
   */
  private buttonMediaBrowserItemMouseDown(): boolean {
    // store when the mouse down event took place.
    this.mousedownTimestamp = Date.now();
    return true;
  }


  /**
   * Event fired when a click event takes place for a media browser item button.
   * 
   * In this case, we are looking to determine how long the mouse button was in the
   * down position (e.g. the duration).  If the duration was greater than 1500 milliseconds,
   * then we will treat the event as a "click and hold" operation; otherwise, we will treat
   * the event as a "click" operation.
   * 
   * @param event Event arguments.
   */
  private buttonMediaBrowserItemClick(event: CustomEvent): boolean {
    // calculate the duration of the mouse down / up operation.
    const duration = Date.now() - this.mousedownTimestamp;
    this.mousedownTimestamp = 0;
    if (duration < 1500) {
      return this.dispatchEvent(event);
    } else {
      return this.dispatchEvent(customEvent(ITEM_SELECTED_WITH_HOLD, event.detail));
    }
  }
}

customElements.define('stpc-media-browser-icons', MediaBrowserIcons);
