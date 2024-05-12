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



  setConfig(config: CardConfig) {
    this.config = JSON.parse(JSON.stringify(config));
    //console.log("base-editor.setConfig():\n%s", JSON.stringify(this.config, null, 2));  // prettyprint
  }


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    super();

    if (!this.sourceListLastUpdatedOn) {
      //console.log("base-editor.constructor() Initializing instance\nsourceListLastUpdatedOn=%s", this.sourceListLastUpdatedOn);
      this.section = Section.PRESETS;
      this.sourceListLastUpdatedOn = 1;
    } else {
      //console.log("base-editor.constructor() Already Initialized\nsourceListLastUpdatedOn=%s", this.sourceListLastUpdatedOn);
    }
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
      //console.log("base-editor.createStore() creating store\nconfig.entity=%s", this.config.entity);
      this.store = new Store(this.hass, this.config, this, this.section, this.config.entity);
    } else {
      //console.log("base-editor.createStore() store already created\nconfig.entity=%s", this.config.entity);
    }

    // set other references obtained from the store.
    this.player = this.store.player;
    this.section = this.store.section;

    //console.log("base-editor.createStore() player reference set - player:\n%s", JSON.stringify(this.config.entity,null,2));

    // TODO - we could also get the source list from the media player attributes.
    // TODO - note that it could be a limited list (versus ALL sources), based upon user configuration.
    //this.player.attributes.source_list

  //  // is this the first render?  if so, then refresh the list.
  //  if (this.sourceListLastUpdatedOn == 1) {
  //    //console.log("base-editor.createStore() calling updateSourceList()");
  //    this.updateSourceList(this.player);
  //  }
  }


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


  protected configChanged(changedConfig: CardConfig | undefined = undefined) {

    //console.log("base-editor.configChanged() - configuration has changed");

    // if card configuration changes were supplied, then update the existing configuration.
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


  //protected configChanged() {
  //  //console.log("base-editor.configChanged() - configuration has changed");
  //  fireEvent(this, 'config-changed', { config: this.config });
  //  this.requestUpdate();
  //}


  protected dispatchClose() {
    return this.dispatchEvent(new CustomEvent('closed'));
  }


  ///**
  // * Updates the sourceList with the most current list of sources from the SoundTouch device.  
  // * 
  // * This method is called when the section is initially displayed.
  // */
  //private updateSourceList(player: MediaPlayer): void {

  //  //console.log("base-editor.updateSourceList() - player object:\n%s", JSON.stringify(player,null,2));

  //  // update the media list; we will force the `sourceListLastUpdatedOn` attribute 
  //  // with the current epoch date (in seconds) so that the refresh is only triggered once.
  //  this.sourceListLastUpdatedOn = Date.now() / 1000;

  //  // call the service to retrieve the media list.
  //  this.soundTouchPlusService.GetSourceList(player.id)
  //    .then(result => {
  //      this.sourceList = result;
  //      this.sourceListLastUpdatedOn = Date.now() / 1000;
  //      //console.log("%c base-editor.render - updateSourceList AFTER update:\n %s=sourceListLastUpdatedOn", "color: green;", JSON.stringify(this.sourceListLastUpdatedOn));
  //      this.requestUpdate();
  //    });
  //}


  public getSourceAccountsList(sourcePrefix: string): any {

    //console.log("base-editor.getSourceAccountsList() Getting source account options");

    const result = [];

    if (this.player) {
      //console.log("base-editor.getSourceAccountsList() Getting sources from player source_list attribute");
      this.player.attributes.source_list
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

    //// add all pandora source accounts to the list.
    //if (this.sourceList) {
    //  for (const sourceItem of (this.sourceList.SourceItems || [])) {
    //    if (sourceItem.Source == 'PANDORA')
    //      result.push(sourceItem.SourceAccount);
    //  }
    //}

    // if no sources found, then add a dummy entry.
    if (result.length == 0) {
      //console.log("base-editor.getSourceAccountsList() No PANDORA sources in SoundTouch source list");
      result.push('No PANDORA sources in SoundTouch source list');
    }

    //console.log("base-editor.getSourceAccountsList() - source list:\n%s", JSON.stringify(result));

    return result;
  }

}
