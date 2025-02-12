// lovelace card imports.
import { css, html, nothing, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

// our imports.
import { BaseEditor } from './base-editor';
import './editor-form';
import './player-general-editor';
import './player-header-editor';
import './player-controls-editor';
import './player-volume-editor';

/** Configuration area editor sections enum. */
enum ConfigArea {
  GENERAL = 'General',
  HEADER = 'Header',
  CONTROLS = 'Controls',
  VOLUME = 'Volume',
}

/** Configuration area editor section keys array. */
const { GENERAL, HEADER, CONTROLS, VOLUME } = ConfigArea;


class PlayerSettingsEditor extends BaseEditor {

  @state() private configArea = GENERAL;

  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult {

    // ensure store is created.
    super.createStore();

    return html`
      <div class="schema-title">
        Settings that control the Player section look and feel
      </div>
      <ha-control-button-group>
        ${[GENERAL, HEADER, CONTROLS, VOLUME].map(
          (configArea) => html`
            <ha-control-button
              selected=${this.configArea === configArea || nothing}
              @click=${() => this.onConfigPlayerSectionClick(configArea)}
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

    // show the desired section editor.
    return choose(this.configArea, [
      [
        GENERAL,
        () => html`<stpc-player-general-editor .config=${this.config} .hass=${this.hass}></stpc-player-general-editor>`,
      ],
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
  private onConfigPlayerSectionClick(configArea: ConfigArea) {

    // show the section editor form.
    this.configArea = configArea;
  }


  /**
   * Style definitions used by this TemplateResult.
   */
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
