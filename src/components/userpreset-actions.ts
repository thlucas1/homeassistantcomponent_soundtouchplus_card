// lovelace card imports.
import { css, html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

// our imports.
import { sharedStylesGrid } from '../styles/shared-styles-grid.js';
import { sharedStylesMediaInfo } from '../styles/shared-styles-media-info.js';
import { sharedStylesFavActions } from '../styles/shared-styles-fav-actions.js';
import { getHomeAssistantErrorMessage } from '../utils/utils.js';
import { FavActionsBase } from './fav-actions-base';
import { Section } from '../types/section';
import { MediaPlayer } from '../model/media-player';
import { IUserPreset } from '../types/soundtouchplus/user-preset';


class UserPresetActions extends FavActionsBase {

  // public state properties.
  @property({ attribute: false }) mediaItem!: IUserPreset;


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super(Section.USERPRESETS);

  }


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected override render(): TemplateResult | void {

    // invoke base class method.
    super.render();

    // render html.
    return html` 
      <div class="userpreset-actions-container">
        ${this.alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this.alertErrorClear}>${this.alertError}</ha-alert>` : ""}
        ${this.alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this.alertInfoClear}>${this.alertInfo}</ha-alert>` : ""}
        <div class="media-info-content">
          <div class="img" style="background:url(${this.mediaItem.ContentItem?.ContainerArt});"></div>
          <div class="media-info-details">
            <div class="grid userpreset-info-grid">
              <div class="grid-action-info-hdr-s">Name</div>
              <div class="grid-action-info-text-s">${this.mediaItem.ContentItem?.Name}</div>

              <div class="grid-action-info-hdr-s">Source</div>
              <div class="grid-action-info-text-s">${this.mediaItem.ContentItem?.Source}</div>

              <div class="grid-action-info-hdr-s">Source Account</div>
              <div class="grid-action-info-text-s">${this.mediaItem.ContentItem?.SourceAccount}</div>

              <div class="grid-action-info-hdr-s">Location</div>
              <div class="grid-action-info-text-s">${this.mediaItem.ContentItem?.Location}</div>

              <div class="grid-action-info-hdr-s">Type</div>
              <div class="grid-action-info-text-s">${this.mediaItem.ContentItem?.TypeValue}</div>

              <div class="grid-action-info-hdr-s">Origin</div>
              <div class="grid-action-info-text-s">${this.mediaItem.origin}</div>

            </div>
          </div>
        </div>
      </div>`;
  }


  /**
   * style definitions used by this component.
   * */
  static get styles() {
    return [
      sharedStylesGrid,
      sharedStylesMediaInfo,
      sharedStylesFavActions,
      css`

      .userpreset-info-grid {
        grid-template-columns: auto auto;
        justify-content: left;
      }

      .userpreset-actions-container {
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;  
      }
    `
    ];
  }


  /**
   * Updates body actions.
   * 
   * @param player Media player instance that will process the update.
   * @param updateActions List of actions that need to be updated, or an empty list to update DEFAULT actions.
   * @returns True if actions update should continue after calling base class method; otherwise, False to abort actions update.
   */
  protected override updateActions(
    player: MediaPlayer,
    updateActions: any[],
  ): boolean {

    // invoke base class method; if it returns false, then we should not update actions.
    if (!super.updateActions(player, updateActions)) {
      return false;
    }

    try {

      // no actions to update for this media type.
      return true;

    }
    catch (error) {

      // clear the progress indicator and set alert error message.
      this.progressHide();
      this.alertErrorSet("UserPreset actions refresh failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {
    }
  }

}

customElements.define('stpc-userpreset-actions', UserPresetActions);
