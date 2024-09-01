// lovelace card imports.
import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

// our imports.
import { BaseEditor } from './base-editor';
import { ConfigArea } from '../types/configarea';
import { Section } from '../types/section'
import { Store } from '../model/store'
import { SECTION_SELECTED, SHOW_SECTION } from '../constants';
import './editor-form';
import './general-editor';
import './pandora-browser-editor';
import './player-editor';
import './preset-browser-editor';
import './recent-browser-editor';
import './source-browser-editor';
import './userpreset-browser-editor';
import {
  dispatch,
  getConfigAreaForSection,
  getSectionForConfigArea,
} from '../utils/utils';


class CardEditor extends BaseEditor {

  @state() private configArea = ConfigArea.GENERAL;

  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // just in case hass property has not been set yet.
    if (!this.hass)
      return html``;

    // ensure store is created.
    super.createStore();

    //console.log("render (editor) - rendering editor\n- this.store.section=%s\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.store.section),
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    return html`
      <ha-control-button-group>
        ${[ConfigArea.GENERAL, ConfigArea.PLAYER, ConfigArea.SOURCE_BROWSER, ConfigArea.PANDORA_BROWSER].map(
          (configArea) => html`
            <ha-control-button
              selected=${this.configArea === configArea || nothing}
              @click=${() => this.OnConfigSectionClick(configArea)}
            >
              ${configArea}
            </ha-control-button>
          `,
        )}
      </ha-control-button-group>
      <ha-control-button-group>
        ${[ConfigArea.PRESET_BROWSER, ConfigArea.USERPRESET_BROWSER, ConfigArea.RECENT_BROWSER].map(
          (configArea) => html`
            <ha-control-button
              selected=${this.configArea === configArea || nothing}
              @click=${() => this.OnConfigSectionClick(configArea)}
            >
              ${configArea}
            </ha-control-button>
          `,
        )}
      </ha-control-button-group>

      ${this.subEditor()}
    `;
  }


  static get styles() {
    return css`
      ha-control-button-group {
        margin-bottom: 8px;
      }

      ha-control-button[selected] {
        --control-button-background-color: var(--primary-color);
      }

      /* TODO TEST - hide CONFIG VISIBILITY tab bar */
      paper-tabs {
        display: none !important;
        border: 1px solid red !important;
      }
    `;
  }


  private subEditor() {

    // show the desired section editor.
    return choose(this.configArea, [
      [
        ConfigArea.GENERAL,
        () => html`<stpc-general-editor .config=${this.config} .hass=${this.hass}></stpc-general-editor>`,
      ],
      [
        ConfigArea.PANDORA_BROWSER,
        () => html`<stpc-pandora-browser-editor .config=${this.config} .hass=${this.hass}></stpc-pandora-browser-editor>`,
      ],
      [
        ConfigArea.PLAYER,
        () => html`<stpc-player-editor .config=${this.config} .hass=${this.hass}></stpc-player-editor>`,
      ],
      [
        ConfigArea.PRESET_BROWSER,
        () => html`<stpc-preset-browser-editor .config=${this.config} .hass=${this.hass}></stpc-preset-browser-editor>`,
      ],
      [
        ConfigArea.RECENT_BROWSER,
        () => html`<stpc-recent-browser-editor .config=${this.config} .hass=${this.hass}></stpc-recent-browser-editor>`,
      ],
      [
        ConfigArea.SOURCE_BROWSER,
        () => html`<stpc-source-browser-editor .config=${this.config} .hass=${this.hass}></stpc-source-browser-editor>`,
      ],
      [
        ConfigArea.USERPRESET_BROWSER,
        () => html`<stpc-userpreset-browser-editor .config=${this.config} .hass=${this.hass}></stpc-userpreset-browser-editor>`,
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
  private OnConfigSectionClick(configArea: ConfigArea) {

    // show the section that we are editing.
    const sectionNew = getSectionForConfigArea(configArea);

    //console.log("OnConfigSectionClick (editor)\n- OLD configArea=%s\n- NEW configArea=%s\n- OLD section=%s\n- NEW section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.configArea),
    //  JSON.stringify(configArea),
    //  JSON.stringify(this.section),
    //  JSON.stringify(sectionNew),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    // store selected ConfigArea.
    Store.selectedConfigArea = configArea;

    // show the section editor form.
    this.configArea = configArea;

    // show the rendered section.
    this.section = sectionNew;
    this.store.section = sectionNew;
    dispatch(SECTION_SELECTED, this.section);
  }


  /**
   * Invoked when the component is added to the document's DOM.
   *
   * In `connectedCallback()` you should setup tasks that should only occur when
   * the element is connected to the document. The most common of these is
   * adding event listeners to nodes external to the element, like a keydown
   * event handler added to the window.
   *
   * Typically, anything done in `connectedCallback()` should be undone when the
   * element is disconnected, in `disconnectedCallback()`.
   */
  connectedCallback() {

    // invoke base class method.
    super.connectedCallback();

    // add event listeners for this control.
    window.addEventListener(SHOW_SECTION, this.OnFooterShowSection);
  }


  /**
   * Invoked when the component is removed from the document's DOM.
   *
   * This callback is the main signal to the element that it may no longer be
   * used. `disconnectedCallback()` should ensure that nothing is holding a
   * reference to the element (such as event listeners added to nodes external
   * to the element), so that it is free to be garbage collected.
   *
   * An element may be re-connected after being disconnected.
   */
  disconnectedCallback() {

    // invoke base class method.
    super.disconnectedCallback();

    // remove event listeners for this control.
    window.removeEventListener(SHOW_SECTION, this.OnFooterShowSection);
  }


  /**
   * Called when your element has rendered for the first time. Called once in the
   * lifetime of an element. Useful for one-time setup work that requires access to
   * the DOM.
   */
  protected firstUpdated(changedProperties: PropertyValues): void {

    // invoke base class method.
    super.firstUpdated(changedProperties);

    // if there are things that you only want to happen one time when the configuration
    // is initially loaded, then do them here.

    //console.log("firstUpdated (editor) - card is being edited, selecting configArea",
    //  JSON.stringify(this.section),
    //);

    // at this point, the first render has occurred.
    // select the configarea for the section so that its settings are automatically displayed.
    const configArea = getConfigAreaForSection(this.section);
    this.configArea = configArea;
    Store.selectedConfigArea = this.configArea;
    this.requestUpdate();

    //console.log("firstUpdated (editor) - first render complete\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section || '*undefined*'),
    //  JSON.stringify(Store.selectedConfigArea),
    //);
  }


  /**
   * Handles the footer `SHOW_SECTION` event.
   * 
   * This will select the appropriate editor configuration section when a footer
   * icon is clicked.
   * 
   * @param args Event arguments that contain the section that was selected.
  */
  protected OnFooterShowSection = (args: Event) => {

    // get the ConfigArea value for the active footer section.
    const sectionToSelect = (args as CustomEvent).detail as Section;
    const configArea = getConfigAreaForSection(sectionToSelect);

    //console.log("OnFooterShowSection (editor) - args:\n%s",
    //  JSON.stringify(args,null,2),
    //);

    //console.log("OnFooterShowSection (editor) - SHOW_SECTION event\n- OLD configArea=%s\n- NEW configArea=%s",
    //  JSON.stringify(this.configArea),
    //  JSON.stringify(configArea)
    //);

    // select the configuration area.
    this.configArea = configArea;

    // store selected ConfigArea.
    Store.selectedConfigArea = this.configArea;
  }
}


customElements.define('stpc-editor', CardEditor);
