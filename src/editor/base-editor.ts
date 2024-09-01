// lovelace card imports.
import { css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { fireEvent, HomeAssistant } from 'custom-card-helpers';

// our imports.
import { CardConfig } from '../types/cardconfig'
import { Store } from '../model/store'
import { MediaPlayer } from '../model/media-player';
import { Section } from '../types/section';
import { SourceList } from '../types/soundtouchplus/sourcelist'
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { dispatch, getObjectDifferences, getSectionForConfigArea } from '../utils/utils';
import { CONFIG_UPDATED, SECTION_SELECTED } from '../constants';


export abstract class BaseEditor extends LitElement {

  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) config!: CardConfig;
  @property({ attribute: false }) store!: Store;
  @property({ attribute: true }) section!: Section;

  /** MediaPlayer instance created from the configuration entity id. */
  public player!: MediaPlayer;

  /** SoundTouchPlus device source list. */
  public sourceList!: SourceList;

  /** SoundTouchPlus services instance. */
  public soundTouchPlusService!: SoundTouchPlusService;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super();

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
   * The config argument object contains the configuration specified by the user for
   * the card.  It will minimally contain:
   *   `config.type = "custom:my-custom-card"`
   * 
   * The `setConfig` method MUST be defined, and is in fact the only function that must be.
   * It doesn't need to actually DO anything, though.
   * 
   * Note that setConfig will ALWAYS be called at the start of the lifetime of the card
   * BEFORE the `hass` object is first provided.  It MAY be called several times during 
   * the lifetime of the card, e.g. if the configuration of the card is changed.
   * 
   * We use it here to update the internal config property, as well as perform some
   * basic validation and initialization of the config.
   * 
   * @param config Contains the configuration specified by the user for the card.
   */
  setConfig(config: CardConfig) {

    //console.log("setConfig (base-editor) enter\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    // copy the passed configuration object to create a new instance.
    const newConfig: CardConfig = JSON.parse(JSON.stringify(config));

    // if entity value not set then render an error card.
    if (!newConfig.entity)
      throw new Error("SoundTouchPlus media player entity id not configured");

    // store configuration so other card sections can access them.
    this.config = newConfig;

    //console.log("setConfig (base-editor) - configuration:\n%s",
    //  JSON.stringify(this.config, null, 2), // prettyprint
    //);

    //console.log("setConfig (base-editor) exit\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);
  }


  /**
   * Creates the common services and data areas that are used by the various card editors.
   * 
   * Note that this method cannot be called from `setConfig` method, as the `hass` property 
   * has not been set set!
  */
  public createStore() {

    // have we already created the store? if so, then don't do it again.
    // we check this here, as most of the `x-editor` inherit from BaseEditor and call this method.
    if (this.store) {
      //console.log("createStore (base-editor) - store already created; nothing to do");
      return;
    }

    // is a player entity configured?  if not, then don't bother.
    if (!this.config.entity) {
      return;
    }

    // get section to display based upon selected configarea.
    const configAreaSection = getSectionForConfigArea(Store.selectedConfigArea);

    // create the store.
    this.store = new Store(this.hass, this.config, this, configAreaSection, this.config.entity);

    // set other references obtained from the store.
    this.player = this.store.player;
    this.section = this.store.section;

    //console.log("createStore (base-editor) - store created\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

  }


  /**
   * Called by the various editor forms when a value has been changed in the configuration editor(s).
   * 
   * @param changedConfig A CardConfig object that contains changes made in the editor.
   */
  protected configChanged(changedConfig: CardConfig | undefined = undefined) {

    //console.log("configChanged (base-editor) - configuration settings changed\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

    //console.log("configChanged (base-editor) - configuration settings changed\n- this.section=%s\n- Store.selectedConfigArea=%s\n- Values changed:\n%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(Store.selectedConfigArea),
    //  JSON.stringify(getObjectDifferences(this.config, changedConfig), null, 2),
    //);

    // were configuration changes supplied?
    let changedValues = {}
    if (changedConfig) {

      // get configuration changes.
      changedValues = getObjectDifferences(this.config, changedConfig);

      // update the existing configuration with supplied changes.
      this.config = {
        ...this.config,
        ...changedConfig,
      };
    }

    // get section to display based upon selected configarea, and ensure that the
    // section area is displayed.
    const configAreaSection = getSectionForConfigArea(Store.selectedConfigArea);
    if (this.section != configAreaSection) {
      //console.log("configChanged (base-editor) - forcing selected section to match selected ConfigArea\n- this.section=%s\n- configAreaSection=%s",
      //  JSON.stringify(this.section),
      //  JSON.stringify(configAreaSection),
      //);
      this.section = configAreaSection;
      this.store.section = this.section;
      dispatch(SECTION_SELECTED, this.section);
    }

    //console.log("configChanged (base-editor) - configuration settings changed\n- changedConfig:\n%s",
    //  JSON.stringify(changedConfig,null,2)
    //);

    // inform Home assistant dashboard that our configuration has changed.
    fireEvent(this, 'config-changed', { config: this.config });

    // request an update, which will force the card editor to re-render.
    this.requestUpdate();

    // inform configured component of the changes; we will let them decide whether to
    // re-render the component, refresh media lists, etc.
    dispatch(CONFIG_UPDATED, changedValues);

    //const configAreaSection2 = getSectionForConfigArea(Store.selectedConfigArea);
    //console.log("configChanged (base-editor) - after requestUpdate\n- this.section=%s\n- Store.selectedConfigArea=%s",
    //  JSON.stringify(this.section),
    //  JSON.stringify(configAreaSection2),
    //  JSON.stringify(Store.selectedConfigArea),
    //);

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

      //console.log("getSourceAccountsList (base-editor) - get accounts for source prefix\n- this.section=%s\n- Store.selectedConfigArea=%s\n- sourcePrefix=%s\n- Player source_list:\n%s",
      //  JSON.stringify(this.section),
      //  JSON.stringify(Store.selectedConfigArea),
      //  JSON.stringify(sourcePrefix),
      //  JSON.stringify(this.player.attributes.source_list, null, 2),
      //);

      for (const source of (this.player.attributes.source_list || [])) {
        if (source.startsWith(sourcePrefix)) {
          let value = source.replace(sourcePrefix, '');
          value = value.replace('(', '');
          value = value.replace(')', '');
          value = value.trim();
          result.push(value);
        }
      }
    } else {
      //console.log("getSourceAccountsList (base-editor) - player reference not set!");
    }

    // if no sources found, then add a dummy entry.
    if (result.length == 0) {
      result.push('No ' + sourcePrefix + ' sources in SoundTouch source list');
    }

    return result;
  }
}
