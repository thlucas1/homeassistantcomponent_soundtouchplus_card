// lovelace card imports.
import { css, html, TemplateResult } from 'lit';

// our imports.
import { BaseEditor } from './base-editor';
import { Section } from '../types/section'
import { PLAYER_CONTROLS_BACKGROUND_OPACITY_DEFAULT } from '../constants'


const CONFIG_SETTINGS_SCHEMA = [
  {
    name: 'playerHeaderTitle',
    label: 'Section title text displayed in the header area',
    required: false,
    type: 'string',
  },
  {
    name: 'playerHeaderArtistTrack',
    label: 'Artist and Track info displayed in the header area',
    required: false,
    type: 'string',
  },
  {
    name: 'playerHeaderAlbum',
    label: 'Album info displayed in the header area',
    required: false,
    type: 'string',
  },
  {
    name: 'playerHeaderNoMediaPlayingText',
    label: 'Text to display in the header area when no media is currently playing',
    required: false,
    type: 'string',
  },
  {
    name: 'playerHeaderBackgroundOpacity',
    label: 'Opacity value for the header area background',
    help: "-1 to 1.0",
    required: false,
    type: 'float',
    default: PLAYER_CONTROLS_BACKGROUND_OPACITY_DEFAULT,
  },
  {
    name: 'playerHeaderHideProgressBar',
    label: 'Hide progress bar in the header area',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'playerHeaderHide',
    label: 'Hide header area of the Player section form',
    required: false,
    selector: { boolean: {} },
  },
];


class PlayerHeaderSettingsEditor extends BaseEditor {

  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult {

    //console.log("player-editor.render() Rendering card");

    // create application common storage area.
    this.section = Section.PLAYER;
    super.createStore();

    // render html.
    return html`
      <div class="schema-title">
        Player Header Status area settings
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

customElements.define('stpc-player-header-editor', PlayerHeaderSettingsEditor);
