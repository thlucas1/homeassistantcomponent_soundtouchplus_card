// lovelace card imports.
import { css, html, TemplateResult } from 'lit';

// our imports.
import { BaseEditor } from './base-editor';
import { Section } from '../types/section';
import { PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT } from '../sections/player';


const CONFIG_SETTINGS_SCHEMA = [
  {
    name: 'playerControlsBackgroundColor',
    label: 'Color value (e.g. "#hhrrggbb") for controls area background gradient',
    help: "'transparent' to disable",
    required: false,
    type: 'string',
    default: PLAYER_CONTROLS_BACKGROUND_COLOR_DEFAULT,
  },
  {
    name: 'playerVolumeControlsHideMute',
    label: 'Hide mute button in the volume controls area',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'playerVolumeControlsHidePower',
    label: 'Hide power button in the volume controls area',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'playerVolumeControlsHideSlider',
    label: 'Hide volume slider in the volume controls area',
    required: false,
    selector: { boolean: {} },
  },
];


class PlayerVolumeSettingsEditor extends BaseEditor {

  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult {

    // ensure store is created.
    super.createStore();

    //console.log("render (player-volume-editor) - rendering player volume settings editor\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    // render html.
    return html`
      <div class="schema-title">
        Player Volume Control area settings
      </div>
      <stpc-editor-form class="stpc-editor-form"
        .schema=${CONFIG_SETTINGS_SCHEMA}
        .section=${Section.PLAYER}
        .store=${this.store}
        .config=${this.config}
        .hass=${this.hass}
      ></stpc-editor-form>
    `;
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
      `;
  }

}

customElements.define('stpc-player-volume-editor', PlayerVolumeSettingsEditor);
