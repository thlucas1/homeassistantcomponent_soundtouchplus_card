/**
 * SoundTouch device SourceItem configuration object.
 * 
 * This interface contains the attributes and subitems that represent a
 * single source configuration of the device.
 */
export interface ISourceItem {

  /** The friendly name of the source (e.g. "My Media Player", "SpotifyConnectUserName", etc). */
  FriendlyName?: string;

  /** True if a local source (e.g. "AUX", "BLUETOOTH", "QPLAY", etc); otherwise, False. */
  IsLocal?: boolean;

  /** True if the source can be rebroadcast in a multi-room zone; otherwise, False. */
  IsMultiroomAllowed?: boolean;

  /** The source of media content (e.g. "TUNEIN", "AIRPLAY", "UPNP", etc). */
  Source?: string;

  /** The account associated with the Source. */
  SourceAccount?: string;

  /** The source title of media content (e.g. "Tunein", "Airplay", "NAS Music Server", etc). */
  SourceTitle?: string;

  /** Indicates whether the source is available or not, and its current status. */
  Status?: string;

  /** 
   * Item's container art url.
   * This is a helper property for the UI, and not part of the SoundTouch API result.
   * */
  image_url?: string;

}
