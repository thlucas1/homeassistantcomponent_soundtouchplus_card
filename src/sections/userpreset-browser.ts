// lovelace card imports.
import { css, html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
//import { readFile, writeFile } from 'fs/promises';
//import { readFileSync } from 'fs';


// our imports.
import '../components/media-browser-list';
import '../components/media-browser-icons';
import { Store } from '../model/store';
import { customEvent } from '../utils/utils';
import { formatTitleInfo } from '../utils/media-browser-utils';
import { MediaPlayer } from '../model/media-player';
import { ITEM_SELECTED, PROGRESS_DONE, PROGRESS_STARTED, SECTION_SELECTED } from '../constants';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { CardConfig } from '../types/cardconfig'
import { ContentItemParent } from '../types/soundtouchplus/contentitem';
import { Section } from '../types/section';

export class UserPresetBrowser extends LitElement {

  /** Home Assistant hass instance. */
  @property({ attribute: false }) public hass!: HomeAssistant;

  /** Application common storage area. */
  @property({ attribute: false }) store!: Store;

  /** Card configuration data. */
  private config!: CardConfig;

  /** MediaPlayer instance created from the configuration entity id. */
  private player!: MediaPlayer;

  /** Indicates if the media list is currently being updated. */
  private isUpdateInProgress!: boolean;

  /** Date and time (in epoch format) of when the media list was last updated. */
  private mediaListLastUpdatedOn!: number;

  /** User preset list. */
  private mediaList!: ContentItemParent[];

  /** SoundTouchPlus services instance. */
  private soundTouchPlusService!: SoundTouchPlusService;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // initialize storage.
    super();

    // force refresh first time.
    this.isUpdateInProgress = false;
    this.mediaListLastUpdatedOn = -1;  
  }


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // set common references from application common storage area.
    this.hass = this.store.hass
    this.config = this.store.config;
    this.player = this.store.player;
    this.soundTouchPlusService = this.store.soundTouchPlusService;

    // if entity value not set then render an error card.
    if (!this.player)
      throw new Error("SoundTouchPlus media player entity id not configured");

    // is this the first render?  if so, then refresh the list.
    if (this.mediaListLastUpdatedOn == -1) {
      if (!this.isUpdateInProgress) {
        this.isUpdateInProgress = true;
        this.updateMediaList();
      } else {
        //console.log("%c userpreset-browser - update already in progress!", "color: orange;");
      }
    }

    // format title and sub-title details.
    const title = formatTitleInfo(this.config.userPresetBrowserTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList);
    const subtitle = formatTitleInfo(this.config.userPresetBrowserSubTitle, this.config, this.player, this.mediaListLastUpdatedOn, this.mediaList);

    // check for conditions that prevent the content from showing.
    let alertText = undefined
    if (!this.mediaList) {
      alertText = 'No User Presets found';
    }

    //console.log("userpreset-browser() - config.userPresets:\n%s", JSON.stringify(this.config.userPresets, null, 2));
    //for (const item of (this.config.userPresets || [])) {
    //  const cip = item as ContentItemParent;
    //  console.log("userPresets.ContentItem:\n%s", JSON.stringify(cip.ContentItem, null, 2));
    //  console.log("userPresets.Name = %s", JSON.stringify(cip.ContentItem?.Name));
    //}

    // render html.
    return html`
      <div class="userpreset-browser-section">
        ${title ? html`<div class="userpreset-browser-title">${title}</div>` : html``}
        ${subtitle ? html`<div class="userpreset-browser-subtitle">${subtitle}</div>` : html``}
        <div class="userpreset-browser-content">
          ${
          (() => {
            if (alertText) {
              return (
                html`<div class="no-items">${alertText}</div>`
              )
            } else if (this.config.userPresetBrowserItemsPerRow === 1) {
              return (
                html`<stpc-media-browser-list
                    .items=${this.mediaList}
                    .store=${this.store}
                    @item-selected=${this.OnItemSelected}
                    ></stpc-media-browser-list>
                    `
              )
            } else {
              return (
                html`<stpc-media-browser-icons
                    .items=${this.mediaList}
                    .store=${this.store}
                    @item-selected=${this.OnItemSelected}
                    ></stpc-media-browser-icons>
                    `
              )
            }
          })()  
          }  
        </div>
      </div>
    `;
  }


  /** 
   * style definitions used by this component.
   * */
  static get styles() {
    return css`

      .userpreset-browser-section {
        color: var(--secondary-text-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .userpreset-browser-title {
        margin-top: 0.5rem;
        align-items: center;
        display: flex;
        flex-shrink: 0;
        flex-grow: 0;
        justify-content: center;
        text-align: center;
        font-weight: bold;
        font-size: 1.0rem;
        color: var(--secondary-text-color);
      }

      .userpreset-browser-subtitle {
        margin: 0.1rem 0;
        align-items: center;
        display: flex;
        justify-content: center;
        text-align: center;
        font-weight: normal;
        font-size: 0.85rem;
        color: var(--secondary-text-color);
      }

      .userpreset-browser-content {
        margin: 0.5rem;
        flex: 3;
        max-height: 100vh;
        overflow-y: auto;
      }

      .no-items {
        text-align: center;
        margin-top: 2rem;
      }
    `;
  }


  /**
   * Handles the `item-selected` event fired when a media browser item is clicked.
   * 
   * @param args Event arguments that contain the media item that was clicked on.
   */
  protected OnItemSelected = (args: CustomEvent) => {
    const mediaItem = args.detail;
    this.PlayItem(mediaItem);
    this.dispatchEvent(customEvent(ITEM_SELECTED, mediaItem));
  };


  /**
   * Calls the SoundTouchPlusService PlayContentItem method to play media.
   * 
   * @param mediaItem The Recent item that was selected.
   */
  private async PlayItem(mediaItem: ContentItemParent) {

    if (mediaItem.ContentItem) {

      // play the content.
      await this.soundTouchPlusService.PlayContentItem(this.player.id, mediaItem.ContentItem);

      // show the player section (only shown if it's active).
      const event = customEvent(SECTION_SELECTED, Section.PLAYER);
      window.dispatchEvent(event);
    }
  }


  /**
   * Updates the mediaList with the most current list of user presets from the configuration.
   * 
   * This method is called when the section is initially displayed, as well as when
   * a refresh request is initiated by the user.
   */
  private updateMediaList(): void {

    // update the media list; we will force the `mediaListLastUpdatedOn` attribute
    // with the current epoch date (in seconds) so that the refresh is only triggered once.
    // we also copy the array (do not use `this.mediaList = this.config.userPresets`, as it
    // maintains object references and causes objects to keep appending!).
    this.mediaListLastUpdatedOn = (Date.now() / 1000);
    this.mediaList = JSON.parse(JSON.stringify(this.config.userPresets || []));

    //console.log('mediaList[0].ContentItem:\n%s', JSON.stringify(this.mediaList[0].ContentItem, null, 2));
    //console.log('mediaList[0].ContentItem.Name:\n%s', JSON.stringify(this.mediaList[0].ContentItem?.Name));

    // was a user presets url specified?
    if (this.config.userPresetsFile || '' != '') {

      //// fetch the user presets from the url, and combine them with the config entries.
      ////console.log('userpreset-browser.updateMediaList - userPresetsFile specified - loading content');
      //const url = this.config.userPresetsFile + '?nocache=' + Date.now()  // force refresh if cached
      //fetch(url)
      //  .then(response => response.json())
      //  .then(result => {
      //    //console.log('mediaList BEFORE push:\n%s', JSON.stringify(this.mediaList, null, 2));
      //    this.mediaList.push(...result);
      //    //console.log('mediaList AFTER push:\n%s', JSON.stringify(this.mediaList, null, 2));
      //    this.mediaListLastUpdatedOn = (Date.now() / 1000);
      //    this.isUpdateInProgress = false;
      //    this.requestUpdate();
      //    //console.log('userpreset-browser.updateMediaList - userPresetsFile specified - loading content COMPLETE 1');
      //    //console.log('mediaList[1].ContentItem:\n%s', JSON.stringify(this.mediaList[1].ContentItem, null, 2));
      //    //console.log('mediaList[1].ContentItem.Name:\n%s', JSON.stringify(this.mediaList[1].ContentItem?.Name));
      //  });

      //// fetch the user presets from the url, and combine them with the config entries.
      //const url = this.config.userPresetsFile + '?nocache=' + Date.now()  // force refresh if cached
      //fetch(url)
      //  .then(response => {
      //    if (!response.ok) {
      //      throw new Error('Network response was not ok');
      //    }
      //    return response.json();
      //  })
      //  .then(result => {
      //    this.mediaList.push(...result as ContentItemParent[]);
      //    this.mediaListLastUpdatedOn = (Date.now() / 1000);
      //    this.isUpdateInProgress = false;
      //    this.requestUpdate();
      //  })
      //  .catch(error => {
      //    console.error(`Could not fetch user presets url:`, error);
      //  });

      // call the service to retrieve the media list.
      const url = this.config.userPresetsFile + '?nocache=' + Date.now()  // force refresh if cached
      this.UserPresetList(url)
        .then(result => {
          //console.log('mediaList BEFORE push:\n%s', JSON.stringify(this.mediaList, null, 2));
          this.mediaList.push(...result);
          //console.log('mediaList AFTER push:\n%s', JSON.stringify(this.mediaList, null, 2));
          this.mediaListLastUpdatedOn = (Date.now() / 1000);
          this.isUpdateInProgress = false;
          //const playerLastUpdatedOn = (this.player.attributes.soundtouchplus_presets_lastupdated || 0);
          //console.log("%c userpreset-browser - updateMediaList info AFTER update:\n player id=%s\n %s=mediaListLastUpdatedOn",
          //  "color: green;",
          //  this.player.id,
          //  this.mediaListLastUpdatedOn);
          this.requestUpdate();
        });

    } else {
      this.isUpdateInProgress = false;
      //console.log('userpreset-browser.updateMediaList - userPresetsFile specified - loading content COMPLETE 2');
    }
  }


  /**
   * Retrieves the list of user presets from a url.
   * 
   * @param url URL that contains user presets (e.g. "/local/soundtouchplus/userpresets.json").
   * @returns A ContentItemParent[] object.
  */
  public async UserPresetList(url: string): Promise<ContentItemParent[]> {

    try {

      //console.log("%cuserpreset-browser.UserPresetList()\n Retrieving url '%s'", "color: orange;", url);

      // show the progress indicator on the main card.
      this.soundTouchPlusService.card.dispatchEvent(customEvent(PROGRESS_STARTED, { section: Section.USERPRESETS }));

      const responseObj = await fetch(url)
        //.then(response => response.json())
        .then(response => {
          if (!response.ok) {
            throw new Error('STPC - Could not fetch userpresets url (' + url + ')');
          }
          return response.json();
        })
        .then(response => {
          const responseObj = response as ContentItemParent[]
          return responseObj;
        })
        .catch(err => {
          console.error('STPC - Could not fetch userpresets url (' + url + '): ', err);
          return [];
        });

      return responseObj as ContentItemParent[];

    } finally {

      // hide the progress indicator on the main card.
      this.soundTouchPlusService.card.dispatchEvent(customEvent(PROGRESS_DONE));
    }
  }

}