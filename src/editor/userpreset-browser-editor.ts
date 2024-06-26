// lovelace card imports.
import { css, html, TemplateResult } from 'lit';

// our imports.
import { BaseEditor } from './base-editor';
import { Section } from '../types/section'

const CONFIG_SETTINGS_SCHEMA = [
  {
    name: 'userPresetBrowserTitle',
    label: 'Section title text',
    help: 'displayed at the top of the section',
    required: false,
    type: 'string',
  },
  {
    name: 'userPresetBrowserSubTitle',
    label: 'Section sub-title text',
    help: 'displayed below the section title',
    required: false,
    type: 'string',
  },
  {
    name: 'userPresetBrowserItemsPerRow',
    label: '# of items to display per row',
    help: 'use 1 for list format',
    required: true,
    type: 'integer',
    default: 4,
    valueMin: 1,
    valueMax: 12,
  },
  {
    name: 'userPresetBrowserItemsHideTitle',
    label: 'Hide item row title text',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'userPresetBrowserItemsHideSource',
    label: 'Hide item row source title text',
    help: 'if Title visible',
    required: false,
    selector: { boolean: {} },
  },
];


class UserPresetSettingsEditor extends BaseEditor {

  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult {

    //console.log("userpreset-browser-editor.render() Rendering card");

    // create application common storage area.
    this.section = Section.USERPRESETS;
    super.createStore();

    // render html.
    return html`
      <div class="schema-title">
        Settings that control the User Preset Browser section look and feel
      </div>
      <stpc-editor-form
        .schema=${CONFIG_SETTINGS_SCHEMA}
        .section=${Section.USERPRESETS}
        .config=${this.config}
        .hass=${this.hass}
      ></stpc-editor-form>
      <div class="schema-title">
        User Preset items must be defined manually in the configuration code editor.
        Please refer to the <a href="https://github.com/thlucas1/homeassistantcomponent_soundtouchplus_card/wiki/Configuration-Options#userpresets-user-preset-content-items" target="_blank">
        wiki documentation</a> for more details and examples.
      </div>
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

customElements.define('stpc-userpreset-browser-editor', UserPresetSettingsEditor);
