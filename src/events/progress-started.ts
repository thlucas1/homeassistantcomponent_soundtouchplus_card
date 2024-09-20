import { DOMAIN_SOUNDTOUCHPLUS } from '../constants';
import { Section } from '../types/Section';

/** 
 * Uniquely identifies the event. 
 * */
export const PROGRESS_STARTED = DOMAIN_SOUNDTOUCHPLUS + '-card-progress-started';


/**
 * Event arguments.
 */
export class ProgressStartedEventArgs {

  // property storage.
  public section: Section;

  /**
   * Initializes a new instance of the class.
   *
   * @param section Section that was selected.
   */
  constructor(section?: Section) {

    this.section = section || Section.UNDEFINED;
  }
}


/**
 * Event constructor.
 */
export function ProgressStartedEvent(section: Section) {

  const args = new ProgressStartedEventArgs();
  args.section = section;

  return new CustomEvent(PROGRESS_STARTED, {
    bubbles: true,
    composed: true,
    detail: args,
  });
}
