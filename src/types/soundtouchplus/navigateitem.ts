import { ContentItem } from './ContentItem';

/**
 * SoundTouch device NavigateItem configuration object.
 * 
 * This interface contains the attributes and subitems that represent a
 * single navigate configuration of the device.
 */
export interface NavigateItem {

  /** 
   * BackupUrl value.
   */
  BackupUrl?: string;

  /** 
   * BitRate value.
   */
  BitRate?: string;

  /** 
   * Parent container ContentItem to navigate, if navigating for child containers.
   * Specify null if navigating a root container.ContentItem object. 
   */
  ContentItem?: ContentItem;

  /** 
   * Description value.
   */
  Description?: string;

  /** 
   * Format value.
   */
  Format?: string;

  /** 
   * Location value.
   */
  Location?: string;

  /** 
   * 
   */
  Logo?: string;

  ///**
  // * Logo value.
  // */
  //MediaItemContainer?: MediaItemContainer;

  /**
   * Mime value.
   */
  Mime?: string;

  /** 
   * Name value.
   */
  Name?: string;

  /** 
   * Playable value.
   */
  Playable?: number;

  /** 
   * Reliability value.
   */
  Reliability?: string;

  /** 
   * Token value.
   */
  Token?: string;

  /** 
   * TypeValue value.
   */
  TypeValue?: string;

  /** 
   * Url value.
   */
  Url?: string;

  /** 
   * UtcTime value.
   */
  UtcTime?: string;

}
