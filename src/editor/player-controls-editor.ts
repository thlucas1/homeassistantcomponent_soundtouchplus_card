// lovelace card imports.
import { css, html, TemplateResult } from 'lit';

// our imports.
import { BaseEditor } from './base-editor';
import { Section } from '../types/section';
import { PLAYER_CONTROLS_ICON_SIZE_DEFAULT } from '../constants';


const CONFIG_SETTINGS_SCHEMA = [
  {
    name: 'playerControlsIconSize',
    label: 'Size of the icons in the Player controls area.',
    help: 'default is "' + PLAYER_CONTROLS_ICON_SIZE_DEFAULT + '"',
    required: false,
    type: 'string',
    default: PLAYER_CONTROLS_ICON_SIZE_DEFAULT,
  },
  {
    name: 'playerControlsHideShuffle',
    label: 'Hide shuffle control button in the controls area',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'playerControlsHideTrackPrev',
    label: 'Hide previous track control button in the controls area',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'playerControlsHidePlayPause',
    label: 'Hide play / pause control button in the controls area',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'playerControlsHideTrackNext',
    label: 'Hide next track control button in the controls area',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'playerControlsHideRepeat',
    label: 'Hide repeat control button in the controls area',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'playerControlsHideToneControls',
    label: 'Hide tone controls button in the controls area',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'playerControlsHide',
    label: 'Hide controls area of the Player section form',
    required: false,
    selector: { boolean: {} },
  },
];


class PlayerControlsSettingsEditor extends BaseEditor {

  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult {

    // ensure store is created.
    super.createStore();

    // render html.
    return html`
      <div class="schema-title">
        Player Media Control area settings
      </div>
      <stpc-editor-form
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

customElements.define('stpc-player-controls-editor', PlayerControlsSettingsEditor);
