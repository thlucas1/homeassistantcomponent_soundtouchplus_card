// our imports.
import { CardConfig } from '../types/cardconfig'
import { Section } from '../types/section'

export function cardDoesNotContainAllSections(config: CardConfig) {
  return config.sections && config.sections.length < Object.keys(Section).length;
}


/**
 * Defines a custom event type and it's details.
 */
export function customEvent(type: string, detail?: unknown) {
  return new CustomEvent(type, {
    bubbles: true,
    composed: true,
    detail,
  });
}


export function dispatch(type: string, detail?: unknown) {
  const event = customEvent(type, detail);
  window.dispatchEvent(event);
}


/**
 * Formats an epoch date to a date locale string.
 * 
 * The date is converted by a call to the `Date.toLocaleString()` method.
 * 
 * @param epochSeconds Epoch date to format (e.g. number of seconds since 01/01/1970.
 * @returns A string with the formatted date.
 */
export function formatDateEpochSecondsToLocaleString(epochSeconds: number | undefined): string | undefined {

  // if epoch date not specified then don't bother.
  if (!epochSeconds)
    return undefined

  // convert epoch number of seconds to epoch number of milliseconds (for JavaScript Date function).
  const epochMS = (epochSeconds || 0) * 1000;
  const epochMSDate = new Date(epochMS);
  const localeDate = epochMSDate.toLocaleString();
  return localeDate
}


/**
* Converts a string value to proper case.
* 
* @param str String to convert to propercase (e.g. "hello world").
* @returns A properly cased string value (e.g. "Hello World").
*/
export function formatStringProperCase(str: string): string | void {
  let upper = true;
  let newStr = "";
  for (let i = 0, l = str.length; i < l; i++) {
    if (str[i] == " ") {
      upper = true;
      newStr += " ";
      continue;
    }
    newStr += upper ? str[i].toUpperCase() : str[i].toLowerCase();
    upper = false;
  }
  return newStr;
}


/**
 * Check if a string is a numeric value or not.
 * 
 * @param numStr String to check for a numeric value.
 * @returns true if the specified string can be converted to a number; otherwise, false.
 */
export function isNumber(numStr: string): boolean {
  return !isNaN(parseFloat(numStr)) && !isNaN(+numStr)
}
