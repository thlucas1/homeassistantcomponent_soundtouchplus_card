## Change Log

All notable changes to this project are listed here.  

Change are listed in reverse chronological order (newest to oldest).  

<span class="changelog">

###### [ 1.0.5 ] - 2024/08/29

  * Fixed various card configuration issues, which will make the card easier to configure via the HA UI.
  * Miscellaneous bug fixes.

###### [ 1.0.4 ] - 2024/06/13

  * Added UserPreset section to allow an unlimited number of user-defined presets to be selected for playing.  Note that these are not SoundTouch device presets, but user-defined presets.  They can be added in the card configuration, or a specified as a JSON data file (for sharing among multiple card instances).
  * Added title formatter options support to `playerHeaderNoMediaPlayingText` configuration value.
  * Added customImageUrls keys to support setting player background images: `playerBackground` sets the background image to display for the Player section when the player is powered on; `playerOffBackground` sets the background image to display for the Player section when the player is powered off.
  * Miscellaneous bug fixes.

###### [ 1.0.3 ] - 2024/05/20

  * Updated the Player section to be a basic media player; more features are planned, but I wanted to get something out there that was functional.
  * Added Sources section to allow media player source to be selected.
  * Added recently played list cache support, that caches recently played content to the local file system.  The cache list is preferred over the SoundTouch device list, since the device removes it's cover art image links quite frequently.  Max cache items is configurable in the SoundTouchPlus device options (per device).
  * Updated wiki documentation.

###### [ 1.0.2 ] - 2024/05/12

  * Updated `README.MD` HACS documentation file.

###### [ 1.0.1 ] - 2024/05/12

  * Removed `console.log` messages that were being used for testing.

###### [ 1.0.0 ] - 2024/05/10

  * Version 1 initial release.

</span>