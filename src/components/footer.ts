// lovelace card imports.
import { css, html, LitElement, TemplateResult, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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
import { CardConfig } from '../types/card-config';
import { Section } from '../types/section';
import { customEvent } from '../utils/utils';


@customElement("stpc-footer")
export class Footer extends LitElement {

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
        label="Player"
        @click=${() => this.onSectionClick(Section.PLAYER)}
        selected=${this.getSectionSelected(Section.PLAYER)}
        hide=${this.getSectionEnabled(Section.PLAYER)}
      ></ha-icon-button>
      <ha-icon-button
        .path=${mdiAudioInputRca}
        label="Sources"
        @click=${() => this.onSectionClick(Section.SOURCES)}
        selected=${this.getSectionSelected(Section.SOURCES)}
        hide=${this.getSectionEnabled(Section.SOURCES)}
      ></ha-icon-button>
      <ha-icon-button
        .path=${mdiStarOutline}
        label="Device Presets"
        @click=${() => this.onSectionClick(Section.PRESETS)}
        selected=${this.getSectionSelected(Section.PRESETS)}
        hide=${this.getSectionEnabled(Section.PRESETS)}
      ></ha-icon-button>
      <ha-icon-button
        .path=${mdiBookmarkMusicOutline}
        label="User Presets"
        @click=${() => this.onSectionClick(Section.USERPRESETS)}
        selected=${this.getSectionSelected(Section.USERPRESETS)}
        hide=${this.getSectionEnabled(Section.USERPRESETS)}
      ></ha-icon-button>
      <ha-icon-button
        .path=${mdiHistory}
        label="Recently Played"
        @click=${() => this.onSectionClick(Section.RECENTS)}
        selected=${this.getSectionSelected(Section.RECENTS)}
        hide=${this.getSectionEnabled(Section.RECENTS)}
      ></ha-icon-button>
      <ha-icon-button
        .path=${mdiPandora}
        label='Pandora Stations'
        @click=${() => this.onSectionClick(Section.PANDORA_STATIONS)}
        selected=${this.getSectionSelected(Section.PANDORA_STATIONS)}
        hide=${this.getSectionEnabled(Section.PANDORA_STATIONS)}
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
    `;
  }


  /**
   * Handles the `click` event fired when a section icon is clicked.
   * 
   * @param section Event arguments.
   */
  private onSectionClick(section: Section) {

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
