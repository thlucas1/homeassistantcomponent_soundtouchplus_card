## Change Log

All notable changes to this project are listed here.  

Change are listed in reverse chronological order (newest to oldest).  

<span class="changelog">

###### [ 1.0.28 ] - 2025/10/29
  
  * Fixed vibrant CORS errors being generated for DLNA server images.

###### [ 1.0.27 ] - 2025/10/28
  
  * Removed vibrant error dialog in the card player section display.  Error details are still logged to the browser console.

###### [ 1.0.26 ] - 2025/10/19

  * Removed `{player.sp_playlist_name_title}` from album title field; copied there by mistake from my SpotifyPlus Card code.

###### [ 1.0.25 ] - 2025/10/18

  * Fixed vibrant `getPalette method failed` errors when trying to load images from DLNA sources.  This was due to CORS (Cross-Origin Resource Sharing) restrictions when accessing images that referenced a direct IP address that was different than the HA server instance.

###### [ 1.0.24 ] - 2025/08/07

  * Fixed progress indicator not showing; HA dropped support for `ha-circular-progress` and replaced it with shoelace `ha-spinner` control.

###### [ 1.0.23 ] - 2025/07/28

  * Fixed a bug in the player section that was causing overlay information details to not update when a media content id change occurred.

###### [ 1.0.22 ] - 2025/06/06

  * Added DLNA URL User Presets that allow DLNA content to be selected for playing.  Note that these are not SoundTouch device presets, but user-defined presets.  They can be added in the card configuration, or a specified as a JSON data file (for sharing among multiple card instances). Check out the [Configuration Options wiki](https://github.com/thlucas1/homeassistantcomponent_soundtouchplus_card/wiki/Configuration-Options#userpresets-dlna-url) for more information.

###### [ 1.0.21 ] - 2025/05/20

  * Added theme variable `stpc-player-background-image-off`; Background image to use for the player section when the player state is off; default value is none.
  * Added theme variable `stpc-player-background-image-idle`; Background image to use for the player section when the player state is idle; default value is none.
  * Added theme variable `stpc-player-background-image`; Background image to use for the player section when the player state is playing; default value is to use currently playing content cover art.
  * Removed card `min-height` value, which allows you to resize the card to any minimum height you wish.

###### [ 1.0.20 ] - 2025/04/30

  * Added `sectionDefault` config option to display the specified section of the card by default.  Check out the [Configuration Options wiki document](https://github.com/thlucas1/homeassistantcomponent_soundtouchplus_card/wiki/Configuration-Options#sectiondefault) for more information.
  * Removed `footerIconSize` from UI Editor screen.  The option is still supported, just not via the UI Editor; value must be edited via the Code Editor.  Check out the [Theming Options wiki document](https://github.com/thlucas1/homeassistantcomponent_soundtouchplus_card/wiki/Themes#card-configuration-options) for more information.

###### [ 1.0.19 ] - 2025/04/28

  * Added sources button to minimized player so that a source can be selected prior to power on / resuming play.

###### [ 1.0.18 ] - 2025/04/17

  * Added theme variable `--stpc-footer-background-color` and `footerBackgroundColor` card configuration option for styling footer background color.
  * Added theme variable `--stpc-footer-background-image` and `footerBackgroundImage` card configuration option for styling footer background gradient.
  * Added theme variable `--stpc-footer-icon-color` and `footerIconColor` card configuration option for styling footer icons color.
  * Added theme variable `--stpc-footer-icon-color-selected` and `footerIconColorSelected` card configuration option for styling footer selected icon color.
  * Added theme variable `--stpc-footer-icon-size` for styling footer icon size; note that the configuration option (`footerIconSize`) for this theme variable already exists.
  * Removed theme variable `--stpc-card-footer-color`; use `--stpc-footer-icon-color` instead.
  * Removed theme variable `--stpc-card-footer-background-color`; use `--stpc-footer-background-color` instead.
  * Removed theme variable `--stpc-card-footer-background-image`; use `--stpc-footer-background-image` instead.

###### [ 1.0.17 ] - 2025/04/03

  * Cleaned up the minimized player card, as well as added vibrant color processing for customimageurl images.

###### [ 1.0.16 ] - 2025/03/30

  * Added theme variable `--stpc-player-minimized-title-color` and `playerMinimizedTitleColor` card configuration option for styling minimized player title text color.
  * Added theme variable `--stpc-player-minimized-title-font-size` and `playerMinimizedTitleFontSize` card configuration option for styling minimized player title text font size.

###### [ 1.0.15 ] - 2025/03/13

  * This release requires the SoundTouchPlus Integration v1.0.106+ release; please make sure you update the SoundTouchPlus Integration prior to updating this SoundTouchPlus Card release.
  * Added `playerMinimizeOnIdle` config option to minimize player card height when player state goes to idle (or off) AND height is not set to `fill`.

###### [ 1.0.14 ] - 2025/03/07

  * Added `Player` section tone controls information UI that allows tone-related options to be adjusted (based on the device).  For ST-300 devices, this includes audio product tone controls (bass, treble) and audio dsp controls (dialog mode).  For ST-10 devices, this includes bass reduction settings.
  * Added `playerControlsHideToneControls` config option to enable / disable tone controls information area.
  * Updated `README.md` documentation for HACS repository.

###### [ 1.0.13 ] - 2025/02/13

  * Documentation updates.

###### [ 1.0.12 ] - 2025/02/12

  * Added filter capability to all sections, which allows you to quickly find content within the section tiles.
  * Added numerous theming options that control font-sizes, control sizes, colors, etc.  Check out the [Theming wiki page](https://github.com/thlucas1/homeassistantcomponent_soundtouchplus_card/wiki/Themes) for more information.
  * Added title formatter option `{medialist.filteritemcount}`; Number of filtered items in the media list.
  * Fixed a bug in all media list rendering controls that was causing the media list not to render for some browser types (Fire HD, iPad Air, etc).

###### [ 1.0.11 ] - 2024/09/20

  * FINALLY got the thing to compile on github build!  Changing to release 1.0.11 to ensure the proper build is picked up.

###### [ 1.0.10 ] - 2024/09/20

  * Converted missed module names to lower-case due to github compile requirements!

###### [ 1.0.9 ] - 2024/09/20

  * Converted all module names to lower-case due to github compile requirements!

###### [ 1.0.8 ] - 2024/09/19

  * Updated `README.MD` with image updates.

###### [ 1.0.7 ] - 2024/09/19

  * Gave the player UI a little bit of a facelift to make it easier to see the player control icons and header information.  Also styles the footer bar to match colors in the artwork image.
  * Updated event processing in various parts of the card; corrected duplicate refresh updates, removed the double progress rings that were displayed in the card editor when refreshing media lists, etc.
  * Removed card configuration `playerHeaderBackgroundOpacity` property (replaced by new `playerHeaderBackgroundColor` property).
  * Added card configuration property `playerHeaderBackgroundColor`: Color value (e.g. "#hhrrggbb") for header area background gradient.  Specify 'transparent' to hide the background area.  Default is '#000000bb'.
  * Removed card configuration `playerControlsBackgroundOpacity` property (replaced by new `playerControlsBackgroundColor` property).
  * Added card configuration property `playerControlsBackgroundColor`: Color value (e.g. "#hhrrggbb") for Player controls area background gradient.  Specify 'transparent' to hide the background area.  Default is '#000000bb'.

###### [ 1.0.6 ] - 2024/09/01

  * Changed medialist to use a cached list when card is displayed in configuration editor.  The medialist will be retrieved once while the card is being edited, and stored in a cache until the card editor is closed.

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