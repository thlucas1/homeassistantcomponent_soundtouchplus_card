// lovelace card imports.
import { css, html, LitElement, TemplateResult, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import {
  mdiAudioInputRca,
  mdiBookmarkMusicOutline,
  mdiHistory,
  mdiPandora,
  mdiPlayCircle,
  mdiStarOutline,
} from '@mdi/js';

// our imports.
import { SHOW_SECTION } from '../constants';
import { CardConfig } from '../types/cardconfig'
import { Section } from '../types/section'
import { customEvent } from '../utils/utils';


const {
  PANDORA_STATIONS,
  PLAYER,
  PRESETS,
  RECENTS,
  SOURCES,
  USERPRESETS,
} = Section;

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
        .path=${mdiPlayCircle}
        .label="Player"
        @click=${() => this.OnSectionClick(PLAYER)}
        selected=${this.getSectionSelected(PLAYER)}
        hide=${this.getSectionEnabled(PLAYER)}
      ></ha-icon-button>
      <ha-icon-button
        .path=${mdiAudioInputRca}
        .label="Sources"
        @click=${() => this.OnSectionClick(SOURCES)}
        selected=${this.getSectionSelected(SOURCES)}
        hide=${this.getSectionEnabled(SOURCES)}
      ></ha-icon-button>
      <ha-icon-button
        .path=${mdiStarOutline}
        .label="Presets"
        @click=${() => this.OnSectionClick(PRESETS)}
        selected=${this.getSectionSelected(PRESETS)}
        hide=${this.getSectionEnabled(PRESETS)}
      ></ha-icon-button>
      <ha-icon-button
        .path=${mdiBookmarkMusicOutline}
        .label="Presets"
        @click=${() => this.OnSectionClick(USERPRESETS)}
        selected=${this.getSectionSelected(USERPRESETS)}
        hide=${this.getSectionEnabled(USERPRESETS)}
      ></ha-icon-button>
      <ha-icon-button
        .path=${mdiHistory}
        .label="Recently Played"
        @click=${() => this.OnSectionClick(RECENTS)}
        selected=${this.getSectionSelected(RECENTS)}
        hide=${this.getSectionEnabled(RECENTS)}
      ></ha-icon-button>
      <ha-icon-button
        .path=${mdiPandora}
        .label='Pandora Stations'
        .hideTitle=false
        .ariaHasPopup=true
        @click=${() => this.OnSectionClick(PANDORA_STATIONS)}
        selected=${this.getSectionSelected(PANDORA_STATIONS)}
        hide=${this.getSectionEnabled(PANDORA_STATIONS)}
      ></ha-icon-button>
    `;
  }


  /**
   * Style definitions used by this card section.
   */
  static get styles() {
    return css`
      :host > *[selected] {
        color: var(--dark-primary-color);
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


  /**
   * Handles the `click` event fired when a section icon is clicked.
   * 
   * @param section Event arguments.
   */
  private OnSectionClick(section: Section) {
    //console.log("OnSectionClick (footer)\n- section=%s",
    //  JSON.stringify(section),
    //);
    this.dispatchEvent(customEvent(SHOW_SECTION, section));
  }


  /**
   * Checks to see if a section is active or not, and returns true for the specified
   * section if it's the active section.  This is what shows the selected section
   * in the footer area.
   * 
   * @param section Section identifier to check.
   */
  private getSectionSelected(section: Section | typeof nothing) {
    //console.log("getSectionSelected (footer)\n CURRENT section=%s, COMPARE section=%s, result=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(section),
    //  JSON.stringify(this.section === section || nothing),
    //);
    return this.section === section || nothing;
  }


  /**
   * Returns nothing if the specified section value is NOT enabled in the configuration,
   * which will cause the section icon to be hidden (via css styling).
   * 
   * @param section Section identifier to check.
   */
  private getSectionEnabled(searchElement: Section) {
    return (this.config.sections && !this.config.sections?.includes(searchElement)) || nothing;
  }

}


customElements.define('stpc-footer', Footer);
