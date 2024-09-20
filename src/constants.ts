import { css } from 'lit';

/** current version of the card. */
export const CARD_VERSION = '1.0.7';

/** SoundTouchPlus integration domain identifier. */
export const DOMAIN_SOUNDTOUCHPLUS = 'soundtouchplus';

/** media_player integration domain identifier. */
export const DOMAIN_MEDIA_PLAYER = 'media_player';

/** prefix used for event dispatching to make them unique throughtout the system. */
const dispatchPrefix = 'stpc-dispatch-event-';

/** uniquely identifies the configuration updated event. */
export const CONFIG_UPDATED = dispatchPrefix + 'config-updated';

/** uniquely identifies the section selected event. */
export const PANDORA_BROWSER_REFRESH = dispatchPrefix + 'pandora-browser-refresh';

/** identifies the media browser refresh event. */
export const MEDIA_BROWSER_REFRESH = 'media-browser-refresh';

/** identifies the item selected event. */
export const ITEM_SELECTED = 'item-selected';

/** identifies the item selected event. */
export const ITEM_SELECTED_WITH_HOLD = 'item-selected-with-hold';

/** identifies the show section event. */
export const SHOW_SECTION = 'show-section';

/** Company branding logo image to display on the card picker */
export const BRAND_LOGO_IMAGE_BASE64 =
  'data:image/png;base64,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';

/** Company branding logo image size to display on the card picker */
export const BRAND_LOGO_IMAGE_SIZE = '90%';

export const listStyle = css`
  .list {
    --mdc-theme-primary: var(--accent-color);
    --mdc-list-vertical-padding: 0px;
    overflow: hidden;
  }
`;
