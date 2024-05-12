// our imports.
import { CARD_VERSION } from './constants';
import { Player } from './sections/player';
import { Card } from './card';
import { PandoraBrowser } from './sections/pandora-browser';
import { PresetBrowser } from './sections/preset-browser';
import { RecentBrowser } from './sections/recent-browser';
import './components/ha-player';


// Good source of help documentation on HA custom cards:
// https://gist.github.com/thomasloven/1de8c62d691e754f95b023105fe4b74b


// Display card version details in console, as well as a link to help docs.
console.groupCollapsed(
  `%cSOUNDTOUCHPLUS-CARD ${CARD_VERSION} IS INSTALLED`,
  "color: green; font-weight: bold"
);
console.log(
  "Wiki Docs:",
  "https://github.com/thlucas1/homeassistantcomponent_soundtouchplus_card/wiki/Configuration-Options"
);
console.groupEnd();


// Register our card for the card picker dialog in the HA UI dashboard
// by adding it to the "window.customCards" array with attributes that
// describe the card and what it provides ("type" and "name" are required).
window.customCards.push({
  type: 'soundtouchplus-card',
  name: 'SoundTouchPlus Card',
  description: 'Home Assistant UI card that supports features unique to the SoundTouchPlus custom integration',
  //documentationURL: 'https://github.com/thlucas1/homeassistantcomponent_soundtouchplus_card/wiki/Configuration-Options',
  preview: true,
});

// add our card sections to the HA UI card picker dialog.
customElements.define('soundtouchplus-card', Card);
customElements.define('stpc-player', Player);
customElements.define('stpc-pandora-browser', PandoraBrowser);
customElements.define('stpc-preset-browser', PresetBrowser);
customElements.define('stpc-recent-browser', RecentBrowser);
