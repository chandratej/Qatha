/**
 * IVersionStorage — replaceable storage port.
 * Implementations: Memory, Firestore, Supabase, local IndexedDB, etc.
 * Domain never imports concrete storage.
 */

import type {
  CreateVersionInput,
  ListVersionsQuery,
  VersionSnapshot,
  VersionTimeline,
} from './types';

export interface IVersionStorage {
  saveVersion(input: CreateVersionInput & { id: string; versionNumber: number; createdAt: string }): Promise<VersionSnapshot>;

  loadVersion(versionId: string): Promise<VersionSnapshot | null>;

  listVersions(query: ListVersionsQuery): Promise<{ items: VersionSnapshot[]; total: number }>;

  /** Soft-delete / archive — history remains queryable if needed */
  deleteVersion(versionId: string): Promise<boolean>;

  /** Next monotonic version number for story+chapter scope */
  nextVersionNumber(storyId: string, chapterId: string | null): Promise<number>;

  getTimeline(storyId: string, chapterId: string | null, limit?: number, offset?: number): Promise<VersionTimeline>;
}
