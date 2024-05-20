// lovelace card imports.
import { css, html, TemplateResult } from 'lit';

// our imports.
import { BaseEditor } from './base-editor';
import { Section } from '../types/section'
import { DOMAIN_MEDIA_PLAYER, DOMAIN_SOUNDTOUCHPLUS } from '../constants';

const CONFIG_SETTINGS_SCHEMA = [
  {
    name: 'sections',
    label: 'Card sections to enable',
    help: 'unchecked items will not be shown',
    required: false,
    type: 'multi_select',
    options: {
      player: 'Player',
      sources: 'Sources',
      presets: 'Presets',
      recents: 'Recently Played',
      pandorastations: 'Pandora Stations',
    },
  },
  {
    name: 'entity',
    label: 'SoundTouch device to retrieve data from',
    help: 'required',
    required: true,
    selector: {
      entity: {
        multiple: false,
        filter: {
          domain: DOMAIN_MEDIA_PLAYER,
          integration: DOMAIN_SOUNDTOUCHPLUS
        }
      }
    },
  },
  {
    name: 'title',
    label: 'Card title text',
    help: 'displayed at the top of the card above the section',
    required: false,
    type: 'string',
  },
  {
    name: 'width',
    label: 'Width of the card',
    help: 'in rem units; or "fill" for 100% width',
    required: false,
    type: 'string',
    default: 35.15,
  },
  {
    name: 'height',
    label: 'Height of the card',
    help: 'in rem units; or "fill" for 100% height',
    required: false,
    type: 'string',
    default: 35.15,
  },
//  {
//    name: 'imageUrlsReplaceHttpWithHttps',
//    label: "Replace HTTP with HTTPS for image url's",
//    required: false,
//    selector: { boolean: {} },
//  },
];


class GeneralEditor extends BaseEditor {

  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult {

    //console.log("general-editor.render() Rendering card");

    // create application common storage area.
    super.createStore();

    // render html.
    return html`
      <div class="schema-title">
        Settings that control the overall look and feel of the card
      </div>
      <stpc-editor-form
        .schema=${CONFIG_SETTINGS_SCHEMA}
        .section=${Section.PLAYER}
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

      ha-formfield {
        height: 26px;
      }
      `;
  }
}

customElements.define('stpc-general-editor', GeneralEditor);
