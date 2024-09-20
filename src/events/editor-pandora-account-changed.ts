import { DOMAIN_SOUNDTOUCHPLUS } from '../constants';

/** 
 * Uniquely identifies the event. 
 * */
export const EDITOR_PANDORA_ACCOUNT_CHANGED = DOMAIN_SOUNDTOUCHPLUS + '-card-editor-pandora-account-changed';


/**
 * Event constructor.
 */
export function EditorPandoraAccountChangedEvent() {

  // no arguments for this event.
  return new CustomEvent(EDITOR_PANDORA_ACCOUNT_CHANGED, {
    bubbles: true,
    composed: true,
    detail: {}
,
  });
}
