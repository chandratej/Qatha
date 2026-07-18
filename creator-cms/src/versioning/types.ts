/** Presentation-facing domain types (mirror packages/shared/versioning). */

export type VersionType = 'AutoCheckpoint' | 'Manual' | 'Publish' | 'Draft';
export type VersionStatus = 'Active' | 'Restored' | 'Archived';

export interface VersionContent {
  title?: string;
  scenes?: Array<{ id: string; title: string; content: string; narrativeFormat?: string }>;
  plainContent?: string;
  contentDelta?: unknown;
}

export interface StoryVersion {
  id: string;
  story_id: string;
  chapter_id: string | null;
  version_number: number;
  version_name: string;
  created_by: string;
  created_at: string;
  version_type: VersionType;
  status: VersionStatus;
  restored_from_id?: string | null;
  word_count?: number;
  content?: VersionContent;
}

export interface VersionTimelineEntry {
  id: string;
  versionNumber: number;
  versionName: string;
  versionType: VersionType;
  status: VersionStatus;
  createdAt: string;
  createdBy: string;
  restoredFromId?: string | null;
}

export function versionTypeLabel(type: VersionType, te = false): string {
  if (te) {
    switch (type) {
      case 'AutoCheckpoint': return 'ఆటో చెక్‌పాయింట్';
      case 'Manual': return 'మాన్యువల్';
      case 'Publish': return 'ప్రచురణ';
      case 'Draft': return 'డ్రాఫ్ట్';
      default: return type;
    }
  }
  switch (type) {
    case 'AutoCheckpoint': return 'Auto checkpoint';
    case 'Manual': return 'Manual checkpoint';
    case 'Publish': return 'Published';
    case 'Draft': return 'Draft save';
    default: return type;
  }
}
