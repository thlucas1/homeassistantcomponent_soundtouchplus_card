// lovelace card imports.
import { css, html, TemplateResult } from 'lit';

// our imports.
import { BaseEditor } from './base-editor';
import { Section } from '../types/section';
import {
  CARD_VERSION,
  DOMAIN_MEDIA_PLAYER,
  DOMAIN_SOUNDTOUCHPLUS,
  FOOTER_ICON_SIZE_DEFAULT
} from '../constants';


const CONFIG_SETTINGS_SCHEMA = [
  {
    name: 'sections',
    label: 'Card sections to enable',
    help: 'unchecked items will not be shown',
    required: false,
    type: 'multi_select',
    options: {
      /* the following must match defined names in `secion.ts` */
      player: 'Player',                       /* Section.PLAYER */
      sources: 'Sources',                     /* Section.SOURCES */
      presets: 'Device Presets',              /* Section.PRESETS */
      userpresets: 'User Presets',            /* Section.USERPRESETS */
      recents: 'Recently Played',             /* Section.RECENTS */
      pandorastations: 'Pandora Stations',    /* Section.PANDORA_STATIONS */
    },
  },
  {
    name: 'entity',
    label: 'SoundTouch media player entity to retrieve data from',
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
    name: 'footerIconSize',
    label: 'Size of the icons in the Footer area.',
    help: 'default is "' + FOOTER_ICON_SIZE_DEFAULT + '"',
    required: false,
    type: 'string',
    default: FOOTER_ICON_SIZE_DEFAULT,
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
  {
    name: 'touchSupportDisabled',
    label: "Disable touch event support",
    help: 'force mouse events',
    required: false,
    selector: { boolean: {} },
  },
];


class GeneralEditor extends BaseEditor {

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
        Settings that control overall look of card - version ${CARD_VERSION}
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

customElements.define('stpc-general-editor', GeneralEditor);
