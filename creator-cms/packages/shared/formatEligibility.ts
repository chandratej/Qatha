/**
 * Katha Content Format Spec v1 — Contest & Monetization chapter/unit gates.
 * Source: Worklog/27_JUL_2026/Katha_Content_Format_and_Payout_Specification_v1.md §2
 *
 * Prerequisite gates sit in front of SPI/Story Trust banding (BR-002 supersession).
 * Formats never gated behind contest wins or credentials — only unit thresholds.
 */

import { getContentTypeDef } from './content-types';

/** Default continuous/episodic formats: contest ≥25, monetize ≥50 published units. */
export const DEFAULT_CONTEST_MIN_UNITS = 25;
export const DEFAULT_MONETIZE_MIN_UNITS = 50;

/** Story Collection: monetize at 5 published stories (units = collection pieces). */
export const COLLECTION_MONETIZE_MIN_UNITS = 5;
/** Story Collection: min pieces to publish as a collection. */
export const COLLECTION_PUBLISH_MIN_UNITS = 3;

export type FormatMonetizationMode =
  | 'full_path' /** contest + monetize chapter gates */
  | 'collection' /** 5-story monetize; contest per-piece no-reentry */
  | 'non_monetized' /** acquisition/contest fuel only */
  | 'unknown';

export type FormatEligibilityProfile = {
  contentTypeId: string;
  monetizationMode: FormatMonetizationMode;
  /** Min published units for contest (null = no chapter-count gate; use per-story rules). */
  contestMinUnits: number | null;
  /** Min published units before SPI banding may unlock creator share (null = never). */
  monetizeMinUnits: number | null;
  /** Contest uses per-story no-re-entry flag instead of (or in addition to) unit count. */
  contestPerStoryNoReentry: boolean;
  /** Interactive Flash requires 2–3 branch points for contest eligibility. */
  contestRequiresBranchPoints?: { min: number; max: number };
  notes: string;
};

const PROFILES: Record<string, FormatEligibilityProfile> = {
  serialized_story: {
    contentTypeId: 'serialized_story',
    monetizationMode: 'full_path',
    contestMinUnits: DEFAULT_CONTEST_MIN_UNITS,
    monetizeMinUnits: DEFAULT_MONETIZE_MIN_UNITS,
    contestPerStoryNoReentry: false,
    notes: 'Contest at 25 chapters; monetize at 50 chapters (then SPI banding applies).',
  },
  epistolary_chat: {
    contentTypeId: 'epistolary_chat',
    monetizationMode: 'full_path',
    contestMinUnits: DEFAULT_CONTEST_MIN_UNITS,
    monetizeMinUnits: DEFAULT_MONETIZE_MIN_UNITS,
    contestPerStoryNoReentry: false,
    notes: 'Chat-Fiction: 25 chapters contest, 50 monetize.',
  },
  interactive_branching: {
    contentTypeId: 'interactive_branching',
    monetizationMode: 'full_path',
    contestMinUnits: DEFAULT_CONTEST_MIN_UNITS,
    monetizeMinUnits: DEFAULT_MONETIZE_MIN_UNITS,
    contestPerStoryNoReentry: false,
    notes: 'Interactive Fiction: 25 chapters contest, 50 monetize (chapter = reconvergent act).',
  },
  short_story_collection: {
    contentTypeId: 'short_story_collection',
    monetizationMode: 'collection',
    contestMinUnits: null,
    monetizeMinUnits: COLLECTION_MONETIZE_MIN_UNITS,
    contestPerStoryNoReentry: true,
    notes:
      'Monetize at 5 stories; SPI at collection level; story 1 permanently free; contest per-story no re-entry.',
  },
  short_story: {
    contentTypeId: 'short_story',
    monetizationMode: 'non_monetized',
    contestMinUnits: null,
    monetizeMinUnits: null,
    contestPerStoryNoReentry: true,
    notes: 'Non-monetized — acquisition/contest fuel. Per-story no re-entry.',
  },
  flash_fiction: {
    contentTypeId: 'flash_fiction',
    monetizationMode: 'non_monetized',
    contestMinUnits: null,
    monetizeMinUnits: null,
    contestPerStoryNoReentry: true,
    notes: 'Non-monetized — free virality. Per-story no re-entry.',
  },
  interactive_flash: {
    contentTypeId: 'interactive_flash',
    monetizationMode: 'non_monetized',
    contestMinUnits: null,
    monetizeMinUnits: null,
    contestPerStoryNoReentry: true,
    contestRequiresBranchPoints: { min: 2, max: 3 },
    notes: 'Non-monetized interactive flash; contest needs 2–3 branch points + no re-entry.',
  },
};

/** Legacy novel → treat as serialized for gates. */
PROFILES.novel = { ...PROFILES.serialized_story, contentTypeId: 'novel' };

export function formatEligibilityProfile(
  contentTypeId: string | null | undefined,
): FormatEligibilityProfile {
  const id = contentTypeId || 'serialized_story';
  if (PROFILES[id]) return PROFILES[id];
  // Unknown types: default to full path (safe for revenue formats) with standard gates
  return {
    contentTypeId: id,
    monetizationMode: 'full_path',
    contestMinUnits: DEFAULT_CONTEST_MIN_UNITS,
    monetizeMinUnits: DEFAULT_MONETIZE_MIN_UNITS,
    contestPerStoryNoReentry: false,
    notes: 'Default full-path gates applied to unknown content type.',
  };
}

export function isFormatMonetizable(contentTypeId: string | null | undefined): boolean {
  const mode = formatEligibilityProfile(contentTypeId).monetizationMode;
  return mode === 'full_path' || mode === 'collection';
}

/**
 * Prerequisite unit gate before SPI banding may grant creator revenue share.
 * Returns met=true when format is non-monetized only after caller also checks mode —
 * use clearsMonetizationUnitGate for payout.
 */
export function clearsMonetizationUnitGate(
  contentTypeId: string | null | undefined,
  publishedUnits: number,
): { met: boolean; required: number | null; reason: string } {
  const profile = formatEligibilityProfile(contentTypeId);
  if (profile.monetizationMode === 'non_monetized') {
    return {
      met: false,
      required: null,
      reason: 'Format is non-monetized by design (acquisition/contest fuel only).',
    };
  }
  const required = profile.monetizeMinUnits;
  if (required == null) {
    return { met: false, required: null, reason: 'No monetization path for this format.' };
  }
  const n = Math.max(0, Number(publishedUnits) || 0);
  if (n >= required) {
    return { met: true, required, reason: `Published units ${n} ≥ ${required}.` };
  }
  return {
    met: false,
    required,
    reason: `Need ${required} published units for monetization (have ${n}).`,
  };
}

export type ContestEligibilityInput = {
  contentTypeId?: string | null;
  publishedUnits: number;
  /** True if this specific story (or collection piece) has already won a contest. */
  hasWonContest?: boolean;
  /** Branch/choice points authored (Interactive Flash). */
  branchPointCount?: number;
  moderationPassed?: boolean;
  wordCountOk?: boolean;
};

export type ContestEligibilityResult = {
  eligible: boolean;
  reasons: string[];
  profile: FormatEligibilityProfile;
};

export function evaluateContestEligibility(input: ContestEligibilityInput): ContestEligibilityResult {
  const profile = formatEligibilityProfile(input.contentTypeId);
  const reasons: string[] = [];
  let eligible = true;

  if (input.moderationPassed === false) {
    eligible = false;
    reasons.push('Must pass moderation before contest submission.');
  }
  if (input.wordCountOk === false) {
    eligible = false;
    reasons.push('Does not meet format word-count guidance.');
  }

  if (profile.contestPerStoryNoReentry && input.hasWonContest) {
    eligible = false;
    reasons.push('This story has already won a contest (no re-entry).');
  }

  if (profile.contestMinUnits != null) {
    const n = Math.max(0, Number(input.publishedUnits) || 0);
    if (n < profile.contestMinUnits) {
      eligible = false;
      reasons.push(
        `Need ≥${profile.contestMinUnits} published units for contest (have ${n}).`,
      );
    }
  }

  if (profile.contestRequiresBranchPoints) {
    const b = Number(input.branchPointCount) || 0;
    const { min, max } = profile.contestRequiresBranchPoints;
    if (b < min || b > max) {
      eligible = false;
      reasons.push(`Interactive Flash contest requires ${min}–${max} branch points (have ${b}).`);
    }
  }

  if (eligible) reasons.push('Contest eligibility checks passed.');

  return { eligible, reasons, profile };
}

/** Story Collection: unit 1 is permanently free for readers. */
export function freeUnitsForContentType(contentTypeId: string | null | undefined): number | null {
  const id = contentTypeId || '';
  if (id === 'short_story_collection') return 1;
  return null; // null → use proven/unproven free-chapter system
}

export function labelForUnit(contentTypeId: string | null | undefined): string {
  const def = getContentTypeDef(contentTypeId);
  if (contentTypeId === 'short_story_collection') return 'story';
  if (def?.maxChapters === 1) return 'piece';
  return 'chapter';
}
