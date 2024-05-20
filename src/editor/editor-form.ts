// lovelace card imports.
import { css, html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

// our imports.
import { BaseEditor } from './base-editor';
import { CardConfig } from '../types/cardconfig';

class Form extends BaseEditor {

  @property({ attribute: false }) schema!: unknown;
  @property({ attribute: false }) data!: unknown;
  @property() changed!: (ev: CustomEvent) => void;


  /**
   * Invoked on each update to perform rendering tasks. 
   * 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult {

    return html`
      <ha-form
        .data=${this.data || this.config}
        .schema=${this.schema}
        .computeLabel=${formatLabel}
        .hass=${this.hass}
        @value-changed=${this.changed || this.OnValueChanged}
      ></ha-form>
    `;
  }


  static get styles() { //: CSSResultGroup {
    return css`
      .root > * {
        display: block;
      }

      .root > *:not([own-margin]):not(:last-child) {
        margin-bottom: 0px;
      }

      .root > :not([own-margin]):not(:last-child) {
          margin-bottom: 4px;
      }

      ha-alert[own-margin] {
        margin-bottom: 4px;
      }
    `;
  }


  /**
   * Handles a "value-changed" event.
   * This event is raised whenever a form value is changed in the UI.
   * 
   * This will update the configuration with the changed value and re-render the
   * card preview area.
   */
  protected OnValueChanged(args: CustomEvent): void {

    //console.log("OnValueChanged (editor-form) - event:\n%s", JSON.stringify(args, null, 2));

    // get the updated changes from event details.
    const changedConfig = (args.detail.value as CardConfig);

    // call configuration changed method to update the existing config with our changes,
    // fire an event that something has changed, and re-render the card preview.
    this.configChanged(changedConfig);
  }
}


/**
 * Formats labels for each editable field in the supplied schema.  
 * 
 * It uses the value assigned to the "label" key as the title by default.
 * If a label key is not supplied, then it uses the value assigned to the "name" key, 
 * and converts it to proper-case (e.g. "myFieldName" returns "My Field Name").
 * 
 * If a "help" key value is supplied, then it adds the value to the label surrounded
 * by parenthesis (e.g. "My Field Name (this is the help value)".
 */
export function formatLabel({ help, label, name }: { name: string; help: string; label: string }) {

  // if label was supplied then just use it as-is.
  if (label) {
    return label + (help ? ` (${help})` : '');
  }

  // otherwise use the proper-case value of the name.
  let unCamelCased = name.replace(/([A-Z])/g, ' $1');
  unCamelCased = unCamelCased.charAt(0).toUpperCase() + unCamelCased.slice(1);

  // if help key supplied, then add the help value in parenthesis.
  return unCamelCased + (help ? ` (${help})` : '');
}


customElements.define('stpc-editor-form', Form);
