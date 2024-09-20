// lovelace card imports.
import { css, html, TemplateResult } from 'lit';

// our imports.
import { BaseEditor } from './base-editor';
import { Section } from '../types/Section';
import { CardConfig } from '../types/CardConfig';
import { EditorPandoraAccountChangedEvent } from '../events/editor-pandora-account-changed';


const CONFIG_SETTINGS_SCHEMA = [
  {
    name: 'pandoraSourceAccount',
    label: 'User account used to connect to Pandora music service',
    help: 'usually an email address',
    required: true,
    selector: {
      select: {
        multiple: false,
        mode: "dropdown",
        sort: true,
        options: []  // dynamically loaded by getSourceAccountsList() method
      }
    }
  },
  {
    name: 'pandoraBrowserTitle',
    label: 'Section title text',
    help: 'displayed at the top of the section',
    required: false,
    type: 'string',
  },
  {
    name: 'pandoraBrowserSubTitle',
    label: 'Section sub-title text',
    help: 'displayed below the section title',
    required: false,
    type: 'string',
  },
  {
    name: 'pandoraBrowserItemsPerRow',
    label: '# of items to display per row',
    help: 'use 1 for list format',
    required: true,
    type: 'integer',
    default: 3,
    valueMin: 1,
    valueMax: 12,
  },
  {
    name: 'pandoraBrowserItemsHideTitle',
    label: 'Hide item row title text',
    required: false,
    selector: { boolean: {} },
  },
];


class PandoraSettingsEditor extends BaseEditor {

  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult {

    // ensure store is created.
    super.createStore();

    //console.log("render (pandora-browser-editor) - rendering pandora settings editor\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    // update select options in configuration settings schema.
    if (CONFIG_SETTINGS_SCHEMA[0]) {
      if (CONFIG_SETTINGS_SCHEMA[0].selector) {
        if (CONFIG_SETTINGS_SCHEMA[0].selector.select) {

          const result = this.getSourceAccountsList('Pandora ');
          CONFIG_SETTINGS_SCHEMA[0].selector.select.options = result;

        }
      }
    }

    // render html.
    return html`
      <div class="schema-title">
        Settings that control the <a href="https://github.com/thlucas1/homeassistantcomponent_soundtouchplus_card/wiki/Configuration-Options#pandora-section-options" target="_blank">
        Pandora Section</a> look and feel
      </div>
      <stpc-editor-form class="stpc-editor-form"
        .schema=${CONFIG_SETTINGS_SCHEMA}
        .section=${Section.PANDORA_STATIONS}
        .store=${this.store}
        .config=${this.config}
        .hass=${this.hass}
        @value-changed=${this.OnValueChanged}
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


  /**
   * Handles a "value-changed" event.
   * This event is raised whenever a form value is changed in the UI.
   * 
   * This will check for user account value changed, and refresh the media list display if needed.
   */
  protected OnValueChanged(args: CustomEvent): void {

    //console.log("OnValueChanged (pandora-browser-editor) - event:\n%s",
    //  JSON.stringify(args, null, 2)
    //);

    // get the updated changes from event details.
    const changedConfig = (args.detail.value as CardConfig);

    // did the pandora user account value change?  
    // if so, then dispatch the pandora browser refresh event to refresh the media list.
    if (this.config.pandoraSourceAccount != changedConfig.pandoraSourceAccount) {

      // inform the card that it needs to refresh the Pandora media list by dispatching
      // the EDITOR_PANDORA_ACCOUNT_CHANGED event.
      document.dispatchEvent(EditorPandoraAccountChangedEvent());
    }

    // note that we do not need to call`this.configChanged()`, as that has already happened
    // in the base class (editor-form) `OnValueChanged` event.
  }
}

customElements.define('stpc-pandora-browser-editor', PandoraSettingsEditor);
