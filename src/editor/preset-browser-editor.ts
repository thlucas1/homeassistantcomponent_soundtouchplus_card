// lovelace card imports.
import { css, html, TemplateResult } from 'lit';

// our imports.
import { BaseEditor } from './base-editor';
import { Section } from '../types/section';
import { EDITOR_DEFAULT_BROWSER_ITEMS_PER_ROW } from '../constants';

const CONFIG_SETTINGS_SCHEMA = [
  {
    name: 'presetBrowserTitle',
    label: 'Section title text',
    help: 'displayed at the top of the section',
    required: false,
    type: 'string',
  },
  {
    name: 'presetBrowserSubTitle',
    label: 'Section sub-title text',
    help: 'displayed below the section title',
    required: false,
    type: 'string',
  },
  {
    name: 'presetBrowserItemsPerRow',
    label: '# of items to display per row',
    help: 'use 1 for list format',
    required: true,
    type: 'integer',
    default: EDITOR_DEFAULT_BROWSER_ITEMS_PER_ROW,
    valueMin: 1,
    valueMax: 6,
  },
  {
    name: 'presetBrowserItemsHideTitle',
    label: 'Hide item row title text',
    required: false,
    selector: { boolean: {} },
  },
  {
    name: 'presetBrowserItemsHideSubTitle',
    label: 'Hide item row sub-title text',
    help: 'if Title visible',
    required: false,
    selector: { boolean: {} },
  },
];


class PresetSettingsEditor extends BaseEditor {

  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult {

    // ensure store is created.
    super.createStore();

    //console.log("render (preset-browser-editor) - rendering preset settings editor\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    // render html.
    return html`
      <div class="schema-title">
        Settings that control the <a href="https://github.com/thlucas1/homeassistantcomponent_soundtouchplus_card/wiki/Configuration-Options#device-preset-section-options" target="_blank">
        Device Preset Section</a> look and feel
      </div>
      <stpc-editor-form class="stpc-editor-form"
        .schema=${CONFIG_SETTINGS_SCHEMA}
        .section=${Section.PRESETS}
        .store=${this.store}
        .config=${this.config}
        .hass=${this.hass}
      ></stpc-editor-form>
    `;
  }


  /**
   * Style definitions used by this TemplateResult.
   * 
   * Use the "stpc-editor-form" class to apply styling to the elements that are dynamically defined by 
   * the HA-FORM element.  This gives you the ability to generate a more compact look and feel to the
   * element, which can save quite a bit of screen real-estate in the process!
   * See the static "styles()" function in the "editor.ts" module for more details.
   */
  static get styles() {
    return css`

      .schema-title {
        margin: 0.4rem 0;
        text-align: left;
        font-size: 1rem;
        color: var(--secondary-text-color);
      }

      /* control the look and feel of the HA-FORM element. */
      .stpc-editor-form {
      }

      `;
  }

}

customElements.define('stpc-preset-browser-editor', PresetSettingsEditor);
