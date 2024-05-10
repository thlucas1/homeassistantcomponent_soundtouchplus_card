// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

// our imports.
import { Store } from '../model/store';
import { CardConfig } from '../types/cardconfig'
import { ContentItemParent } from '../types/soundtouchplus/contentitem';
import { Section } from '../types/section';
import { listStyle, ITEM_SELECTED, ITEM_SELECTED_WITH_HOLD } from '../constants';
import { customEvent } from '../utils/utils';
import {
  itemsWithFallbacks,
  renderMediaBrowserContentItem,
  styleMediaBrowserItemBackgroundImage,
  styleMediaBrowserItemTitle
} from '../utils/media-browser-utils';

export class MediaBrowserList extends LitElement {

  @property({ attribute: false }) store!: Store;
  @property({ type: Array }) items!: ContentItemParent[];

  @state() mousedownTimestamp!: number;

  private config!: CardConfig;
  private section!: Section;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    super();
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
    let hideSource = true;
    let itemsPerRow = 1;
    if (this.section == Section.PRESETS) {
      itemsPerRow = this.config.presetBrowserItemsPerRow || 3;
      hideTitle = this.config.presetBrowserItemsHideTitle || false;
      hideSource = this.config.presetBrowserItemsHideSource || false;
    } else if (this.section == Section.RECENTS) {
      itemsPerRow = this.config.recentBrowserItemsPerRow || 3;
      hideTitle = this.config.recentBrowserItemsHideTitle || false;
      hideSource = this.config.recentBrowserItemsHideSource || false;
    } else if (this.section == Section.PANDORA_STATIONS) {
      itemsPerRow = this.config.pandoraBrowserItemsPerRow || 3;
      hideTitle = this.config.pandoraBrowserItemsHideTitle || false;
      hideSource = true;
    }

    return html`
      <style>
        :host {
          --items-per-row: ${itemsPerRow};
        }
      </style>
      <mwc-list multi class="list">
        ${itemsWithFallbacks(this.items, this.config).map((item, index) => {
          return html`
            ${styleMediaBrowserItemBackgroundImage(item.thumbnail, index)}
            <mwc-list-item 
              class="button"
              @click=${() => this.buttonMediaBrowserItemClick(customEvent(ITEM_SELECTED, item))}
              @mousedown=${() => this.buttonMediaBrowserItemMouseDown()}

            >
              <div class="row">${renderMediaBrowserContentItem(item.ContentItem, !item.thumbnail || !hideTitle, !hideSource)}</div>
            </mwc-list-item>
          `;
        })}
      </mwc-list>
    `;
  }


  /**
   * Event fired when a mousedown event takes place for a media browser item button.
   * In this case, we will store the current time (in milliseconds) so that we can calculate
   * the duration in the "click" event (occurs after a mouseup event).
   * 
   * @param event Event arguments.
   */
  private buttonMediaBrowserItemMouseDown(): boolean {
    //console.log("media-browser-icons.buttonMediaBrowserItemMouseDown()");
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
    //console.log("media-browser-icons.buttonClick()\nevent=%s\nmousedown duration=%s", JSON.stringify(event), JSON.stringify(duration));
    if (duration < 1500) {
      //console.log("media-browser-icons.buttonClick()\nmousedown duration was less than 1500ms - dispatching ITEM_SELECTED event");
      return this.dispatchEvent(event);
    } else {
      //console.log("media-browser-icons.buttonClick()\nmousedown duration was greater than 1500ms - dispatching ITEM_SELECTED_WITH_HOLD event");
      return this.dispatchEvent(customEvent(ITEM_SELECTED_WITH_HOLD, event.detail));
    }
  }


  /**
   * Style definitions used by this card section.
   * 
   * --control-button-padding: 0px;   // image with rounded corners
   */
  static get styles() {
    return [
      css`
        .button {
          --control-button-padding: 0px;
          --icon-width: 94px;
          height: 100px;
        }

        .row {
          display: flex;
        }

        .thumbnail {
          width: var(--icon-width);
          height: var(--icon-width);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: left;
        }

        .title {
          font-size: 1.1rem;
          align-self: center;
          flex: 1;
        }
      `,
      styleMediaBrowserItemTitle,
      listStyle,
    ];
  }
}

customElements.define('stpc-media-browser-list', MediaBrowserList);
