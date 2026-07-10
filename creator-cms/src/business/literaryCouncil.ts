import {
  COUNCIL_CAREER_LEVELS,
  PAID_REVIEWER_ELIGIBILITY,
  type CouncilCareerLevelId,
  type GenreSpecializationId,
  type ProfessionalReviewRoleId,
} from '../../../packages/shared/literary-council';
import type { StoryTrustLevelId } from '../../../packages/shared/story-trust';

const TRUST_RANK: Record<StoryTrustLevelId, number> = {
  incubation: 0,
  foundation: 1,
  emerging: 2,
  performing: 3,
  catalyst: 4,
  anchor: 5,
  apex: 6,
};

export interface AuthorEligibility {
  verifiedAuthor: boolean;
  storyTrustLevel: StoryTrustLevelId;
  totalReaders: number;
}

export interface PaidReviewEligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export function checkPaidReviewEligibility(author: AuthorEligibility): PaidReviewEligibilityResult {
  const reasons: string[] = [];
  const minTrust = PAID_REVIEWER_ELIGIBILITY.minStoryTrustLevel;
  if (PAID_REVIEWER_ELIGIBILITY.requiresVerifiedAuthor && !author.verifiedAuthor) {
    reasons.push('Verify your author account in Settings');
  }
  if (TRUST_RANK[author.storyTrustLevel] < TRUST_RANK[minTrust]) {
    reasons.push(`Story Trust must reach ${minTrust} level for paid professional reviews`);
  }
  return { eligible: reasons.length === 0, reasons };
}

export function councilLevelForRqi(rqi: number, reviewCount: number): CouncilCareerLevelId {
  if (rqi >= 92 && reviewCount >= 50) return 'master_reviewer';
  if (rqi >= 85 && reviewCount >= 25) return 'council_member';
  if (rqi >= 75 && reviewCount >= 12) return 'senior_reviewer';
  if (rqi >= 60 && reviewCount >= 3) return 'certified_reviewer';
  if (reviewCount >= 1) return 'author';
  return 'writer';
}

export function councilLevelLabel(level: CouncilCareerLevelId): string {
  return COUNCIL_CAREER_LEVELS.find((l) => l.id === level)?.label ?? level;
}

export function normalizeStoryGenre(genre?: string): GenreSpecializationId | string {
  if (!genre) return 'romance';
  const g = genre.toLowerCase().replace(/\s+/g, '_');
  const map: Record<string, GenreSpecializationId> = {
    horror: 'horror',
    romance: 'romance',
    fantasy: 'fantasy',
    thriller: 'thriller',
    comedy: 'comedy',
    children: 'children',
    historical: 'historical',
    sci_fi: 'sci_fi',
    science_fiction: 'sci_fi',
    mystery: 'mystery',
    mythology: 'mythology',
  };
  return map[g] ?? g;
}

export function isValidProfessionalRole(id: string): id is ProfessionalReviewRoleId {
  return ['literary_reviewer', 'developmental_editor', 'copy_editor'].includes(id);
}