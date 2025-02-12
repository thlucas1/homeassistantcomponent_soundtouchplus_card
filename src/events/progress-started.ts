import { DOMAIN_SOUNDTOUCHPLUS } from '../constants';

/** 
 * Uniquely identifies the event. 
 * */
export const PROGRESS_STARTED = DOMAIN_SOUNDTOUCHPLUS + '-card-progress-started';


/**
 * Event constructor.
 */
export function ProgressStartedEvent() {

  // this event has no arguments.
  return new CustomEvent(PROGRESS_STARTED, {
    bubbles: true,
    composed: true,
    detail: {},
  });

}
