/** Media library entities — Vol_03-08 */

export const MEDIA_ASSET_TYPES = ['cover', 'illustration', 'reference', 'other'] as const;
export type MediaAssetType = (typeof MEDIA_ASSET_TYPES)[number];

export interface MediaAsset {
  id: string;
  story_id: string;
  uploaded_by?: string | null;
  url: string;
  filename?: string | null;
  mime_type?: string | null;
  asset_type: MediaAssetType;
  attribution?: string | null;
  license?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StoryContributorAttribution {
  id: string;
  story_id: string;
  user_id: string;
  role: string;
  display_name?: string | null;
  attribution_order?: number;
  revenue_share_bps?: number;
  created_at?: string;
  updated_at?: string;
}