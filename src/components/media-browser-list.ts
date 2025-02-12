// lovelace card imports.
import { css, html, TemplateResult } from 'lit';
import { when } from 'lit/directives/when.js';

// our imports.
import { MediaBrowserBase } from './media-browser-base';
import { Section } from '../types/section';
import { listStyle, ITEM_SELECTED } from '../constants';
import { customEvent } from '../utils/utils';


export class MediaBrowserList extends MediaBrowserBase {

  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super();
  }


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // invoke base class method.
    super.render();

    // define control to render - search criteria.
    const nowPlayingBars = html`
      <div class="bars" slot="meta">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>
      `;

    // render html.
    return html`
      <mwc-list multi class="list" style=${this.styleMediaBrowser()}">
        ${this.buildMediaBrowserItems().map((item, index) => {
          return html`
            ${this.styleMediaBrowserItemBackgroundImage(item.mbi_item.image_url, index)}
            ${(() => {
              if (this.isTouchDevice) {
                return (html`
                  <mwc-list-item
                    hasMeta
                    class="${this.listItemClass}"
                    @touchstart=${{ handleEvent: () => this.onMediaBrowserItemTouchStart(customEvent(ITEM_SELECTED, item)), passive: true }}
                    @touchend=${() => this.onMediaBrowserItemTouchEnd(customEvent(ITEM_SELECTED, item))}
                  >
                    <div class="row">${this.renderMediaBrowserItem(item, !item.mbi_item.image_url || !this.hideTitle, !this.hideSubTitle)}</div>
                    ${when(
                      item.mbi_item.is_active && this.store.player.isPlaying() && this.section == Section.SOURCES,
                      () => html`${nowPlayingBars}`,
                    )}
                  </mwc-list-item>
                `);
              } else {
                return (html`
                  <mwc-list-item
                    hasMeta
                    class="${this.listItemClass}"
                    @click=${() => this.onMediaBrowserItemClick(customEvent(ITEM_SELECTED, item))}
                    @mousedown=${() => this.onMediaBrowserItemMouseDown()}
                    @mouseup=${() => this.onMediaBrowserItemMouseUp(customEvent(ITEM_SELECTED, item))}
                  >
                    <div class="row">${this.renderMediaBrowserItem(item, !item.mbi_item.image_url || !this.hideTitle, !this.hideSubTitle)}</div>
                    ${when(
                      item.mbi_item.is_active && this.store.player.isPlaying() && this.section == Section.SOURCES,
                      () => html`${nowPlayingBars}`,
                    )}
                  </mwc-list-item>
                `);
              }
        })()}
          `;
    })}
      </mwc-list>
    `;
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

        .button-device {
          --icon-width: 50px !important;
          margin: 0 !important;
        }

        .button-track {
          --icon-width: 80px !important;
          margin: 0 !important;
          padding: 0.25rem;
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
          mask-repeat: no-repeat;
          mask-position: left;
          border-radius: 0.5rem;
        }

        .title {
          color: var(--stpc-media-browser-items-list-color, var(--stpc-media-browser-items-color, var(--primary-text-color, #ffffff)));
          font-size: var(--stpc-media-browser-items-title-font-size, 1.1rem);
          font-weight: normal;
          padding: 0 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          align-self: center;
          flex: 1;
        }

        .title-active {
          color: var(--stpc-media-browser-items-list-color, var(--stpc-media-browser-items-color, var(--primary-text-color, #ffffff)));
        }

        .subtitle {
          font-size: var(--stpc-media-browser-items-subtitle-font-size, 0.8rem);
          font-weight: normal;
          line-height: 120%;
          padding-bottom: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        /* *********************************************************** */
        /* the remaining styles are used for the sound animation icon. */
        /* *********************************************************** */
        .bars {
          height: 30px;
          left: 50%;
          margin: -30px 0 0 -20px;
          position: relative;
          top: 65%;
          width: 40px;
        }

        .bar {
          background: var(--dark-primary-color);
          bottom: 1px;
          height: 3px;
          position: absolute;
          width: 3px;      
          animation: sound 0ms -800ms linear infinite alternate;
          display: block;
        }

        @keyframes sound {
          0% {
            opacity: .35;
            height: 3px; 
          }
          100% {
            opacity: 1;       
            height: 1rem;        
          }
        }

        .bar:nth-child(1)  { left: 1px; animation-duration: 474ms; }
        .bar:nth-child(2)  { left: 5px; animation-duration: 433ms; }
        .bar:nth-child(3)  { left: 9px; animation-duration: 407ms; }
        .bar:nth-child(4)  { left: 13px; animation-duration: 458ms; }
        /*.bar:nth-child(5)  { left: 17px; animation-duration: 400ms; }*/
        /*.bar:nth-child(6)  { left: 21px; animation-duration: 427ms; }*/
        /*.bar:nth-child(7)  { left: 25px; animation-duration: 441ms; }*/
        /*.bar:nth-child(8)  { left: 29px; animation-duration: 419ms; }*/
        /*.bar:nth-child(9)  { left: 33px; animation-duration: 487ms; }*/
        /*.bar:nth-child(10) { left: 37px; animation-duration: 442ms; }*/

      `,
      listStyle,
    ];
  }
}

customElements.define('stpc-media-browser-list', MediaBrowserList);
