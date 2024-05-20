import { HomeAssistant } from 'custom-card-helpers';

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    customCards: Array<{ type: string; name: string; description: string; preview: boolean }>;
  }
}


export interface MediaPlayerItem {
  title: string;
  thumbnail?: string;
  children?: MediaPlayerItem[];
  children_media_class?: string;
  media_class?: string;
  media_content_type?: string;
  media_content_id?: string;
}

export interface TemplateResult {
  result: string[];
}

interface HassEntityExtended {
  platform: string;
}

export interface HomeAssistantWithEntities extends HomeAssistant {
  entities: {
    [entity_id: string]: HassEntityExtended;
  };
}
