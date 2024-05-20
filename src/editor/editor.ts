// lovelace card imports.
import { css, html, nothing, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

// our imports.
import { BaseEditor } from './base-editor';
import { Section } from '../types/section'
import { SECTION_SELECTED } from '../constants';
import './editor-form';
import './general-editor';
import './pandora-browser-editor';
import './player-editor';
import './preset-browser-editor';
import './recent-browser-editor';
import './source-browser-editor';
import { dispatch } from '../utils/utils';

/** Configuration area editor sections enum. */
enum ConfigArea {
  GENERAL = 'General',
  PLAYER = 'Player',
  SOURCE_BROWSER = 'Sources',
  PRESET_BROWSER = 'Presets',
  RECENT_BROWSER = 'Recents',
  PANDORA_BROWSER = 'Pandora',
}

/** Configuration area editor section keys array. */
const { GENERAL, PLAYER, SOURCE_BROWSER, PRESET_BROWSER, RECENT_BROWSER, PANDORA_BROWSER } = ConfigArea;

class CardEditor extends BaseEditor {

  @state() private configArea = GENERAL;

  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult {

    if (!this.section) {
      this.section = Section.PLAYER;
    }

    // if no sections are selected then select the defaults.
    if (!this.config.sections || this.config.sections.length === 0) {
      this.config.sections = [Section.PRESETS, Section.RECENTS];
    }

    return html`
      <ha-control-button-group>
        ${[GENERAL, PLAYER, SOURCE_BROWSER, PRESET_BROWSER, RECENT_BROWSER, PANDORA_BROWSER].map(
          (configArea) => html`
            <ha-control-button
              selected=${this.configArea === configArea || nothing}
              @click=${() => this.OnSectionButtonClick(configArea)}
            >
              ${configArea}
            </ha-control-button>
          `,
        )}
      </ha-control-button-group>

      ${this.subEditor()}
    `;
  }


  private subEditor() {

    //console.log("subEditor()\n this.configArea=%s", this.configArea);

    // show the desired section editor.
    return choose(this.configArea, [
      [
        GENERAL,
        () => html`<stpc-general-editor .config=${this.config} .hass=${this.hass}></stpc-general-editor>`,
      ],
      [
        PLAYER,
        () => html`<stpc-player-editor .config=${this.config} .hass=${this.hass}></stpc-player-editor>`,
      ],
      [
        SOURCE_BROWSER,
        () => html`<stpc-source-browser-editor .config=${this.config} .hass=${this.hass}></stpc-source-browser-editor>`,
      ],
      [
        PRESET_BROWSER,
        () => html`<stpc-preset-browser-editor .config=${this.config} .hass=${this.hass}></stpc-preset-browser-editor>`,
      ],
      [
        RECENT_BROWSER,
        () => html`<stpc-recent-browser-editor .config=${this.config} .hass=${this.hass}></stpc-recent-browser-editor>`,
      ],
      [
        PANDORA_BROWSER,
        () => html`<stpc-pandora-browser-editor .config=${this.config} .hass=${this.hass}></stpc-pandora-browser-editor>`,
      ],
    ]);
  }


  /**
   * Handles the `click` event fired when an editor section button is clicked.
   * 
   * This will set the configArea attribute, which will display the selected editor section settings.
   * 
   * @param args Event arguments that contain the configArea that was clicked on.
   */
  private OnSectionButtonClick(configArea: ConfigArea) {

    // show the section that we are editing.
    let sectionNew = Section.PLAYER;
    if (configArea == GENERAL) {
      sectionNew = Section.PLAYER;
    } else if (configArea == PLAYER) {
      sectionNew = Section.PLAYER;
    } else if (configArea == SOURCE_BROWSER) {
      sectionNew = Section.SOURCES;
    } else if (configArea == PRESET_BROWSER) {
      sectionNew = Section.PRESETS;
    } else if (configArea == RECENT_BROWSER) {
      sectionNew = Section.RECENTS;
    } else if (configArea == PANDORA_BROWSER) {
      sectionNew = Section.PANDORA_STATIONS;
    }

    //console.log("editor.OnSectionButtonClick()\n OLD configArea=%s, NEW configArea=%s\n OLD section=%s, NEW section=%s", JSON.stringify(this.configArea), JSON.stringify(configArea), JSON.stringify(this.section), JSON.stringify(sectionNew));

    // show the section editor form.
    this.configArea = configArea;

    // show the rendered section.
    this.section = sectionNew;
    dispatch(SECTION_SELECTED, sectionNew);
  }


  static get styles() {
    return css`
      ha-control-button[selected] {
        --control-button-background-color: var(--primary-color);
      }
    `;
  }
}

customElements.define('stpc-editor', CardEditor);
