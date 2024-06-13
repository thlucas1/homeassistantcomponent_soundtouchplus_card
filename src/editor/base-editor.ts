// lovelace card imports.
import { css, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { fireEvent, HomeAssistant } from 'custom-card-helpers';

// our imports.
import { CardConfig } from '../types/cardconfig'
import { Store } from '../model/store'
import { MediaPlayer } from '../model/media-player';
import { Section } from '../types/section';
import { SourceList } from '../types/soundtouchplus/sourcelist'
import { SoundTouchPlusService } from '../services/soundtouchplus-service';

export abstract class BaseEditor extends LitElement {

  /** Home Assistant hass instance. */
  @property({ attribute: false }) hass!: HomeAssistant;

  /** Card configuration data. */
  @property({ attribute: false }) config!: CardConfig;

  /** Application common storage area. */
  @property({ attribute: false }) store!: Store;

  @state() section!: Section;
  @state() sourceListLastUpdatedOn!: number;

  /** MediaPlayer instance created from the configuration entity id. */
  public player!: MediaPlayer;

  /** Date and time (in epoch format) of when the source list was last updated. */
  //public sourceListLastUpdatedOn!: number;

  /** SoundTouchPlus device source list. */
  public sourceList!: SourceList;

  /** SoundTouchPlus services instance. */
  public soundTouchPlusService!: SoundTouchPlusService;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    super();

    // initialize storage.
    if (!this.sourceListLastUpdatedOn) {
      this.section = Section.PRESETS;
      this.sourceListLastUpdatedOn = 1;
    }
  }


  /**
   * Style definitions used by this TemplateResult.
   */
  static get styles() {
    return css`
      ha-svg-icon {
        margin: 5px;
      }
      ha-control-button {
        white-space: nowrap;
      }
      ha-control-button-group {
        margin: 5px;
      }
      div {
        margin-top: 20px;
      }
    `;
  }


  /**
   * Home Assistant will call setConfig(config) when the configuration changes.  This
   * is most likely to occur when changing the configuration via the UI editor, but
   * can also occur if YAML changes are made (for cards without UI config editor).
   * 
   * If you throw an exception in this method (e.g. invalid configuration, etc), then
   * Home Assistant will render an error card to notify the user.
   * 
   * Note that setConfig will ALWAYS be called at the start of the lifetime of the card
   * BEFORE the `hass` object is first provided.  It MAY be called several times during 
   * the lifetime of the card, e.g. if the configuration of the card is changed.
   * 
   * @param config Contains the configuration specified by the user for the card.
   */
  setConfig(config: CardConfig) {

    // store a reference to the card configuration.
    this.config = JSON.parse(JSON.stringify(config));
    //console.log("base-editor.setConfig():\n%s", JSON.stringify(this.config, null, 2));  // prettyprint
  }


  /**
   * Creates the common services and data areas that are used by the various card editors.
   * 
   * It is called by each section editor, since all of them inherit from BaseEditor.  We
   * will check for this, and only create the store one time.
   * 
   * Note that this method cannot be called from `setConfig` method, as the `hass` property 
   * has not been set set!
  */
  public createStore() {

    // is a player entity configured?  if not, then don't bother.
    if (!this.config.entity) {
      return
    }

    // create the store.
    // we only need to do this once, as each editor section will call this from their render() methods.
    if (!this.store) {
      this.store = new Store(this.hass, this.config, this, this.section, this.config.entity);
    }

    // set other references obtained from the store.
    this.player = this.store.player;
    this.section = this.store.section;
  }


  /**
   * Called by the various editor forms when a value has been changed in the configuration editor(s).
   * 
   * @param changedConfig A CardConfig object that contains changes made in the editor.
   */
  protected configChanged(changedConfig: CardConfig | undefined = undefined) {

    // update the existing configuration if configuration changes were supplied.
    if (changedConfig) {
      this.config = {
        ...this.config,
        ...changedConfig,
      };
    }

    // fire an event indicating that the configuration has changed.
    fireEvent(this, 'config-changed', { config: this.config });

    // request an update, which will force the card editor to re-render.
    this.requestUpdate();
  }


  protected dispatchClose() {
    return this.dispatchEvent(new CustomEvent('closed'));
  }


  /**
   * Called by various editor forms to retrieve a list of source accounts that match
   * the specified sourcePrefix argument.
   * 
   * @param sourcePrefix A source prefix (e.g. "PANDORA", "SPOTIFY", etc).
   * @returns A list of accounts defined for that source.
   * 
   * For example, let's say the following sources are defined to the SoundTouch device:
   * - source="SPOTIFY", sourceAccount="mySpotifyUserId"
   * - source="SPOTIFY", sourceAccount="SpotifyConnectUserName"
   * - source="SPOTIFY", sourceAccount="SpotifyAlexaUserName"
   * This method would return: ["mySpotifyUserId", "SpotifyConnectUserName", "SpotifyAlexaUserName"]
   * 
   */
  public getSourceAccountsList(sourcePrefix: string): any {

    const result = [];

    if (this.player) {
      for (const source of (this.player.attributes.source_list || [])) {
        if (source.startsWith(sourcePrefix)) {
          let value = source.replace(sourcePrefix, '');
          value = value.replace('(', '');
          value = value.replace(')', '');
          value = value.trim();
          result.push(value);
        }
      }
    }

    // if no sources found, then add a dummy entry.
    if (result.length == 0) {
      result.push('No ' + sourcePrefix + ' sources in SoundTouch source list');
    }

    return result;
  }
}
