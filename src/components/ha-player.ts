// lovelace card imports.
import { html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

// our imports.
import { Store } from '../model/store';
import { MediaPlayerEntityFeature } from '../types/mediaplayer-entityfeature';

class HaPlayer extends LitElement {

  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) features!: MediaPlayerEntityFeature[];

  /** 
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // get current media player state.
    const state = this.store.hass.states[this.store.player.id];

    // load all features supported by the player.
    let supportedFeatures = 0;
    this.features.forEach((feature) => (supportedFeatures += feature));

    const playerState = {
      ...state,
      attributes: { ...state.attributes, supported_features: supportedFeatures },
    };

    // render content.
    return html` 
      <more-info-content
        .stateObj=${playerState} 
        .hass=${this.store.hass}>
      </more-info-content> `;
  }
}

customElements.define('stpc-ha-player', HaPlayer);
