// lovelace card imports.
import { css, html, LitElement, TemplateResult, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiHome, mdiStarOutline, mdiHistory, mdiPandora } from '@mdi/js';

// our imports.
import { SHOW_SECTION } from '../constants';
import { CardConfig } from '../types/cardconfig'
import { Section } from '../types/section'
import { customEvent } from '../utils/utils';


const { PRESETS, RECENTS, PANDORA_STATIONS, PLAYER } = Section;

class Footer extends LitElement {

  @property({ attribute: false }) config!: CardConfig;
  @property() section!: Section;

  /** 
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    return html`
      <ha-icon-button
        hide=${this.hide(PLAYER)}
        .path=${mdiHome}
        @click=${() => this.dispatchSection(PLAYER)}
        selected=${this.selected(PLAYER)}
      ></ha-icon-button>
      <ha-icon-button
        hide=${this.hide(PRESETS)}
        .path=${mdiStarOutline}
        @click=${() => this.dispatchSection(PRESETS)}
        selected=${this.selected(PRESETS)}
      ></ha-icon-button>
      <ha-icon-button
        hide=${this.hide(RECENTS)}
        .path=${mdiHistory}
        @click=${() => this.dispatchSection(RECENTS)}
        selected=${this.selected(RECENTS)}
      ></ha-icon-button>
      <ha-icon-button
        hide=${this.hide(PANDORA_STATIONS)}
        .path=${mdiPandora}
        @click=${() => this.dispatchSection(PANDORA_STATIONS)}
        selected=${this.selected(PANDORA_STATIONS)}
      ></ha-icon-button>
    `;
  }


  private dispatchSection(section: Section) {
    this.dispatchEvent(customEvent(SHOW_SECTION, section));
  }

  private selected(section: Section | typeof nothing) {
    return this.section === section || nothing;
  }


  private hide(searchElement: Section) {
    return (this.config.sections && !this.config.sections?.includes(searchElement)) || nothing;
  }


  /**
   * Style definitions used by this card section.
   */
  static get styles() {
    return css`
      :host > *[selected] {
        color: var(--accent-color);
      }

      :host > *[hide] {
        display: none;
      }

      .ha-icon-button {
        --mwc-icon-button-size: 3rem;
        --mwc-icon-size: 2rem;
      }
    `;
  }

//  /**
//   * Style definitions used by this card section.
//   */
//  static get styles() {
//    return css`
//      :host {
//        display: flex;
//        justify-content: space-between;
//      }
//      :host > * {
//        padding: 0;
//      }
//      :host > *[selected] {
//        color: var(--accent-color);
//      }
//      :host > *[hide] {
//        display: none;
//      }
//      .ha-icon-button {
//        --mwc-icon-button-size: 3rem;
//        --mwc-icon-size: 2rem;
//      }
//    `;
//  }
}

customElements.define('stpc-footer', Footer);
