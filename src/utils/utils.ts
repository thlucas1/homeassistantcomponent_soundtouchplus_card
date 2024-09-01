// our imports.
import { CardConfig } from '../types/cardconfig'
import { ConfigArea } from '../types/configarea';
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
  * Returns a Section value for the supplied ConfigArea.
  * 
  * @param configArea ConfigArea to retrieve the corresponding section value for.
  */
export function getSectionForConfigArea(configArea: ConfigArea) {

  // get section value for supplied ConfigArea value.
  let section = Section.UNDEFINED;
  if (configArea == ConfigArea.GENERAL) {
    section = Section.PLAYER;
  } else if (configArea == ConfigArea.PANDORA_BROWSER) {
    section = Section.PANDORA_STATIONS;
  } else if (configArea == ConfigArea.PLAYER) {
    section = Section.PLAYER;
  } else if (configArea == ConfigArea.PRESET_BROWSER) {
    section = Section.PRESETS;
  } else if (configArea == ConfigArea.RECENT_BROWSER) {
    section = Section.RECENTS;
  } else if (configArea == ConfigArea.SOURCE_BROWSER) {
    section = Section.SOURCES;
  } else if (configArea == ConfigArea.USERPRESET_BROWSER) {
    section = Section.USERPRESETS;
  }


  //console.log("getSectionForConfigArea - return section for ConfigArea\n-Section=%s for ConfigArea %s",
  //  JSON.stringify(section),
  //  JSON.stringify(configArea),
  //);

  return section;
}


/**
  * Returns a ConfigArea value for the supplied Section value.
  * 
  * @param configArea Section value to retrieve the corresponding ConfigArea value for.
  */
export function getConfigAreaForSection(section: Section) {

  // get section value for supplied ConfigArea value.
  let configArea = ConfigArea.GENERAL;
  if (section == Section.PLAYER) {
    configArea = ConfigArea.PLAYER;
  } else if (section == Section.PANDORA_STATIONS) {
    configArea = ConfigArea.PANDORA_BROWSER;
  } else if (section == Section.PRESETS) {
    configArea = ConfigArea.PRESET_BROWSER;
  } else if (section == Section.RECENTS) {
    configArea = ConfigArea.RECENT_BROWSER;
  } else if (section == Section.SOURCES) {
    configArea = ConfigArea.SOURCE_BROWSER;
  } else if (section == Section.USERPRESETS) {
    configArea = ConfigArea.USERPRESET_BROWSER;
  }

  //console.log("getConfigAreaForSection - return ConfigArea for section\n-configArea=%s for Section %s",
  //  JSON.stringify(section),
  //  JSON.stringify(configArea),
  //);

  return configArea;
}


/**
  * Returns true if the dashboard editor is active;
  * otherwise, false.
  * 
  * HA uses "?edit=1" querystring to denote dashboard is in edit mode.
  */
export function isCardInDashboardEditor() {

  //console.log("isCardInDashboardEditor - processing url querystring parms");

  // get current url querystring.
  const queryString = window.location.search;
  const urlParms = new URLSearchParams(queryString);

  //const urlKeys = urlParms.keys();
  //const urlValues = urlParms.values();
  //console.log("isCardInDashboardEditor - querystring parms\n- urlParms=%s\n- urlKeys:\n%s\n- urlValues:\n%s",
  //  JSON.stringify(urlParms),
  //  JSON.stringify(urlKeys, null, 2),
  //  JSON.stringify(urlValues, null, 2),
  //);

  // is `edit=1` parameter present?  if so, then the dashboard is in edit mode.
  const urlParmEdit = urlParms.get('edit');
  let result = false;
  if (urlParmEdit == '1') {
    result = true;
  }

  //console.log("isCardInDashboardEditor - result=%s",
  //  JSON.stringify(result)
  //);

  return result;
}


/**
  * Returns true if the card is currently being previewed in the card editor; 
  * otherwise, false.
  * 
  * The parentElement structure will look like the following when the MAIN card
  * is in edit preview mode (in the card configuration editor preview pane):
  * 
  * (HA 2024.08.1 release):
  * - parentElement1.tagName='HUI-CARD',   className=undefined
  * - parentElement2.tagName='DIV',        className='element-preview'
  * - parentElement3.tagName='DIV',        className='content'
  * - parentElement4.tagName='HA-DIALOG',  className=undefined
  * 
  * The parentElement structure will look like the following when the EDITOR card
  * is in edit preview mode (in the card configuration editor preview pane):
  * 
  * (HA 2024.08.1 release):
  * - parentElement1.tagName='DIV',        className='gui-editor'
  * - parentElement2.tagName='DIV',        className='wrapper'
  */
export function isCardInEditPreview(cardElement: Element) {

  //console.log("isCardInEditPreview - processing parentElement data");

  let parent1Cls = undefined;
  let parent2Cls = undefined;

  // get parent element data.
  if (cardElement) {

    //console.log("isCardInEditPreview - ParentElement tagName info:\n parentElement1=%s\n parentElement2=%s\n parentElement3=%s\n parentElement4=%s\n parentElement5=%s\n parentElement6=%s\n parentElement7=%s",
    //  cardElement.parentElement?.tagName,
    //  cardElement.parentElement?.parentElement?.tagName,
    //  cardElement.parentElement?.parentElement?.parentElement?.tagName,
    //  cardElement.parentElement?.parentElement?.parentElement?.parentElement?.tagName,
    //  cardElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.tagName,
    //  cardElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.tagName,
    //  cardElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.tagName,
    //);

    //console.log("isCardInEditPreview - ParentElement className info:\n parentElement1=%s\n parentElement2=%s\n parentElement3=%s\n parentElement4=%s\n parentElement5=%s\n parentElement6=%s\n parentElement7=%s",
    //  cardElement.parentElement?.className,
    //  cardElement.parentElement?.parentElement?.className,
    //  cardElement.parentElement?.parentElement?.parentElement?.className,
    //  cardElement.parentElement?.parentElement?.parentElement?.parentElement?.className,
    //  cardElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.className,
    //  cardElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.className,
    //  cardElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.className,
    //);

    const parent1Elm = cardElement.parentElement;
    if (parent1Elm) {
      parent1Cls = parent1Elm.className || undefined;
      const parent2Elm = parent1Elm.parentElement;
      if (parent2Elm) {
        parent2Cls = parent2Elm.className || undefined;
      }
    }
  } else {
    //console.log("isCardInEditPreview - cardElement was undefined");
  }

  // check if the main or editor cards are in the configuration editor preview pane.
  let result = false;
  if (parent2Cls == 'element-preview') {
    // MAIN card is in the configuration editor preview pane.
    result = true;
  } else if (parent1Cls == 'gui-editor') {
    // EDITOR card is in the configuration editor preview pane.
    result = true;
  }

  //console.log("isCardInEditPreview - result=%s",
  //  JSON.stringify(result)
  //);

  return result;
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


export function getObjectDifferences(obj1: any, obj2: any): any {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 !== obj2 ? [obj1, obj2] : undefined;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  const uniqueKeys = new Set([...keys1, ...keys2]);

  const differences: any = {};

  for (const key of uniqueKeys) {
    const value1 = obj1[key];
    const value2 = obj2[key];

    if (typeof value1 === 'object' && typeof value2 === 'object') {
      const nestedDifferences = getObjectDifferences(value1, value2);
      if (nestedDifferences) {
        differences[key] = nestedDifferences;
      }
    } else if (value1 !== value2) {
      differences[key] = [value1, value2];
    }
  }

  return Object.keys(differences).length === 0 ? undefined : differences;
}
