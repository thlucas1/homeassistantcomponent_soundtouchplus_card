// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

// our imports.
import { Store } from '../model/store';
import { CardConfig } from '../types/card-config';
import { ContentItemParent } from '../types/soundtouchplus/content-item';
import { Section } from '../types/section';
import { listStyle, ITEM_SELECTED, ITEM_SELECTED_WITH_HOLD } from '../constants';
import { customEvent } from '../utils/utils';
import {
  buildMediaBrowserItems,
  renderMediaBrowserItem,
  styleMediaBrowserItemBackgroundImage,
  styleMediaBrowserItemTitle
} from '../utils/media-browser-utils';

export class MediaBrowserList extends LitElement {

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
    let listItemClass = 'button';
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
      // make the source icons half the size of regular list buttons.
      listItemClass += ' button-source';
    } else if (this.section == Section.USERPRESETS) {
      itemsPerRow = this.config.presetBrowserItemsPerRow || 3;
      hideTitle = this.config.presetBrowserItemsHideTitle || false;
      hideSubTitle = this.config.presetBrowserItemsHideSource || false;
    }

    //console.log("%c render (media-browser-list)\n Section %s items:\n%s",
    //  "color: orange;",
    //  JSON.stringify(this.section),
    //  JSON.stringify(this.items, null, 2),
    //);

    // render html.
    return html`
      <style>
        :host {
          --items-per-row: ${itemsPerRow};
        }
      </style>
      <mwc-list multi class="list">
        ${buildMediaBrowserItems(this.items || [], this.config, this.section).map((item, index) => {
          return html`
            ${styleMediaBrowserItemBackgroundImage(item.media_browser_thumbnail, index, this.section)}
            <mwc-list-item
              class="${listItemClass}"
              @click=${() => this.buttonMediaBrowserItemClick(customEvent(ITEM_SELECTED, item))}
              @mousedown=${() => this.buttonMediaBrowserItemMouseDown()}

            >
              <div class="row">${renderMediaBrowserItem(item, !item.media_browser_thumbnail || !hideTitle, !hideSubTitle)}</div>
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
          height: var(--icon-width);
          margin: 0.4rem 0.0rem;
        }

        .button-source {
          --icon-width: 50px !important;
          margin: 0 !important;
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
          border-radius: 0.5rem;
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
