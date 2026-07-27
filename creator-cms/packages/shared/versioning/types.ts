/**
 * Katha Story Versioning — domain types (storage-agnostic).
 * Presentation and application layers must use only these concepts.
 */

export type VersionType = 'AutoCheckpoint' | 'Manual' | 'Publish' | 'Draft';

export type VersionStatus = 'Active' | 'Restored' | 'Archived';

/** Content payload for a version snapshot — format-agnostic blob. */
export interface VersionContent {
  title?: string;
  /** Prose scenes (Narrative OS) */
  scenes?: Array<{ id: string; title: string; content: string; narrativeFormat?: string }>;
  /** Flat HTML / text fallback */
  plainContent?: string;
  /** Opaque editor delta / branching graph / bubbles JSON */
  contentDelta?: unknown;
}

export interface VersionMetadata {
  id: string;
  storyId: string;
  /** Chapter number as string id, or null for story-level snapshot */
  chapterId: string | null;
  versionNumber: number;
  versionName: string;
  createdBy: string;
  createdAt: string;
  versionType: VersionType;
  status: VersionStatus;
  /** When status is Restored, points to the version that was restored */
  restoredFromId?: string | null;
  wordCount?: number;
}

export interface VersionSnapshot {
  metadata: VersionMetadata;
  content: VersionContent;
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

export interface VersionTimeline {
  storyId: string;
  chapterId: string | null;
  entries: VersionTimelineEntry[];
  total: number;
}

export interface CreateVersionInput {
  storyId: string;
  chapterId?: string | null;
  versionName?: string;
  versionType: VersionType;
  createdBy: string;
  content: VersionContent;
  /** Optional: mark as restored copy of another version */
  restoredFromId?: string | null;
  status?: VersionStatus;
}

export interface ListVersionsQuery {
  storyId: string;
  chapterId?: string | null;
  limit?: number;
  offset?: number;
  versionType?: VersionType;
}

export interface CheckpointRules {
  /** Min ms between auto checkpoints for same chapter */
  minIntervalMs: number;
  /** Min content length change (chars) to trigger significant-edit checkpoint */
  significantEditChars: number;
  /** Create on story create */
  onStoryCreate: boolean;
  /** Create on chapter create */
  onChapterCreate: boolean;
  /** Create on publish */
  onPublish: boolean;
  /** Create on explicit manual save version */
  onManualSave: boolean;
  maxVersionsPerChapter: number;
}

export const DEFAULT_CHECKPOINT_RULES: CheckpointRules = {
  minIntervalMs: 60_000,
  significantEditChars: 200,
  onStoryCreate: true,
  onChapterCreate: true,
  onPublish: true,
  onManualSave: true,
  maxVersionsPerChapter: 100,
};

/** Future extension points (stubs only in MVP1) */
export interface StoryBranch {
  id: string;
  storyId: string;
  name: string;
  baseVersionId: string;
  createdAt: string;
}
