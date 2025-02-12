// lovelace card imports.
import { LitElement, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

// our imports.
import { Store } from '../model/store';
import { Section } from '../types/section';
import { MediaPlayer } from '../model/media-player';
import { SoundTouchPlusService } from '../services/soundtouchplus-service';
import { getHomeAssistantErrorMessage, isCardInEditPreview } from '../utils/utils';
import { ProgressStartedEvent } from '../events/progress-started';
import { ProgressEndedEvent } from '../events/progress-ended';

// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":fav-actions-base");


export class FavActionsBase extends LitElement {

  // public state properties.
  @property({ attribute: false }) protected store!: Store;
  @property({ attribute: false }) protected mediaItem!: any;

  // private state properties.
  @state() protected alertError?: string;
  @state() protected alertInfo?: string;

  /** MediaPlayer instance created from the configuration entity id. */
  protected player!: MediaPlayer;

  /** SoundTouchPlus services instance. */
  protected soundTouchPlusService!: SoundTouchPlusService;

  /** Type of media being accessed. */
  protected section!: Section;

  /** Indicates if actions are currently being updated. */
  protected isUpdateInProgress!: boolean;

  /** True if the card is in edit preview mode (e.g. being edited); otherwise, false. */
  protected isCardInEditPreview!: boolean;


  /**
   * Initializes a new instance of the class.
   * 
   * @param section Section that is currently selected.
   */
  constructor(section: Section) {

    // invoke base class method.
    super();

    // initialize storage.
    this.isUpdateInProgress = false;
    this.section = section;

  }



  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // set common references from application common storage area.
    this.player = this.store.player;
    this.soundTouchPlusService = this.store.soundTouchPlusService;

    // all html is rendered in the inheriting class.
  }


  /**
   * Invoked when the component is added to the document's DOM.
   *
   * In `connectedCallback()` you should setup tasks that should only occur when
   * the element is connected to the document. The most common of these is
   * adding event listeners to nodes external to the element, like a keydown
   * event handler added to the window.
   */
  public connectedCallback() {

    // invoke base class method.
    super.connectedCallback();

    // determine if card configuration is being edited.
    this.isCardInEditPreview = isCardInEditPreview(this.store.card);

  }


  /**
   * Called when the element has rendered for the first time. Called once in the
   * lifetime of an element. Useful for one-time setup work that requires access to
   * the DOM.
   */
  protected firstUpdated(changedProperties: PropertyValues): void {

    // invoke base class method.
    super.firstUpdated(changedProperties);

    // refresh the body actions.
    this.updateActions(this.player, []);
  }


  /**
   * Clears the error and informational alert text.
   */
  protected alertClear() {
    this.alertError = undefined;
    this.alertInfo = undefined;
  }


  /**
   * Clears the error alert text.
   */
  protected alertErrorClear() {
    this.alertError = undefined;
  }


  /**
   * Sets the alert error message, and clears the informational alert message.
   */
  protected alertErrorSet(message: string): void {
    this.alertError = message;
    this.alertInfo = undefined;
  }


  /**
   * Clears the info alert text.
   */
  protected alertInfoClear() {
    this.alertInfo = undefined;
  }


  /**
   * Sets the alert info message, and clears the informational alert message.
   */
  protected alertInfoSet(message: string): void {
    this.alertInfo = message;
    this.alertError = undefined;
  }


  /**
   * Hide visual progress indicator.
   */
  protected progressHide(): void {
    this.isUpdateInProgress = false;
    this.store.card.dispatchEvent(ProgressEndedEvent());
  }


  /**
   * Show visual progress indicator.
   */
  protected progressShow(): void {
    this.store.card.dispatchEvent(ProgressStartedEvent());
  }


  /**
   * Handles the `click` event fired when a media item control icon is clicked.
   * 
   * @param control Event arguments.
   */
  protected onClickMediaItem(mediaItem: any) {

    // play the selected media item.
    this.PlayMediaItem(mediaItem);

  }


  /**
   * Calls the SoundTouchPlusService Card_PlayMediaBrowserItem method to play media.
   * 
   * @param mediaItem The medialist item that was selected.
   */
  protected async PlayMediaItem(mediaItem: any) {

    try {

      // show progress indicator.
      this.progressShow();

      // play media item.
      await this.soundTouchPlusService.PlayContentItem(this.player, mediaItem);

      // show player section.
      this.store.card.SetSection(Section.PLAYER);

    }
    catch (error) {

      // set error status,
      this.alertErrorSet("Could not play media item.  " + getHomeAssistantErrorMessage(error));

    }
    finally {

      // hide progress indicator.
      this.progressHide();

    }

  }


  /**
   * Handles the `click` event fired when a control icon is clicked.
   * This method should be overridden by the inheriting class.
   * 
   * @param action Action to execute.
   */
  protected async onClickAction(action: any): Promise<boolean> {

    throw new Error("onClickAction not implemented for action \"" + action + "\".");

  }


  /**
   * Updates body actions.
   * 
   * @param player Media player instance that will process the update.
   * @param updateActions List of actions that need to be updated, or an empty list to update DEFAULT actions.
   * @returns True if actions update should continue after calling base class method; otherwise, False to abort actions update.
   */
  protected updateActions(
    player: MediaPlayer,
    _updateActions: any[],
  ): boolean {

    if (debuglog.enabled) {
      debuglog("updateActions - updating actions: %s",
        JSON.stringify(Array.from(_updateActions.values())),
      );
    }

    // check if update is already in progress.
    if (!this.isUpdateInProgress) {
      this.isUpdateInProgress = true;
    } else {
      this.alertErrorSet("Previous refresh is still in progress - please wait");
      return false;
    }

    // if card is being edited, then don't bother.
    if (this.isCardInEditPreview) {
      this.isUpdateInProgress = false;
      return false;
    }

    // if player reference not set then we are done;
    // this does not need to be checked for SOURCES section.
    if ((!player) && (this.section != Section.SOURCES)) {
      this.isUpdateInProgress = false;
      this.alertErrorSet("Player reference not set in updateActions");
      return false;
    }

    // if no media item ContentItem, then don't bother;
    // this does not need to be checked for DEVICE section.
    if ((!this.mediaItem.ContentItem) && (this.section != Section.SOURCES)) {
      this.isUpdateInProgress = false;
      this.alertErrorSet("MediaItem not set in updateActions");
      return false;
    }

    // clear alerts.
    this.alertClear();

    // indicate caller can refresh it's actions.
    return true;

  }

}
