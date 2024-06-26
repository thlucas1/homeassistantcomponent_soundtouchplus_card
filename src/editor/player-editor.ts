// lovelace card imports.
import { css, html, nothing, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

// our imports.
import { BaseEditor } from './base-editor';
import { Section } from '../types/section'
import './editor-form';
import './player-header-editor';
import './player-controls-editor';
import './player-volume-editor';

/** Configuration area editor sections enum. */
enum ConfigArea {
  HEADER = 'Header',
  CONTROLS = 'Controls',
  VOLUME = 'Volume',
}

/** Configuration area editor section keys array. */
const { HEADER, CONTROLS, VOLUME } = ConfigArea;

class PlayerSettingsEditor extends BaseEditor {

  @state() private configArea = HEADER;

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

    //// if no sections are selected then select the defaults.
    //if (!this.config.sections || this.config.sections.length === 0) {
    //  this.config.sections = [Section.PLAYER];
    //}

    return html`
      <div class="schema-title">
        Settings that control the Player section look and feel
      </div>
      <ha-control-button-group>
        ${[HEADER, CONTROLS, VOLUME].map(
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
        HEADER,
        () => html`<stpc-player-header-editor .config=${this.config} .hass=${this.hass}></stpc-player-header-editor>`,
      ],
      [
        CONTROLS,
        () => html`<stpc-player-controls-editor .config=${this.config} .hass=${this.hass}></stpc-player-controls-editor>`,
      ],
      [
        VOLUME,
        () => html`<stpc-player-volume-editor .config=${this.config} .hass=${this.hass}></stpc-player-volume-editor>`,
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

    // show the section editor form.
    this.configArea = configArea;
  }


  static get styles() {
    return css`
      .schema-title {
        margin: 0.4rem 0;
        text-align: left;
        font-size: 1rem;
        color: var(--secondary-text-color);
      }

      ha-control-button[selected] {
        --control-button-background-color: var(--primary-color);
      }
    `;
  }
}

customElements.define('stpc-player-editor', PlayerSettingsEditor);
