import type { PeerReviewRequest, ReviewerAssignment, StructuredReviewComment } from '../types/platform';
import { REVIEW_PACKAGE } from '../../../packages/shared/reviewer-marketplace';
import { computeStoryQualityIndex, demoSqiFromTrust } from '../business/storyQualityIndex';
import {
  DEV_REVIEW_SEED_VERSION,
  DEV_SANDBOX_RQI,
  markDevSeedApplied,
} from './reviewDevSandbox';
import { DEMO_REVIEW_MANUSCRIPT_TE } from './reviewManuscriptOptions';
import { roundRqi } from './reviewerReputation';

const PEER_REVIEWS_KEY = 'katha_peer_review_requests';
const REVIEWER_ASSIGNMENTS_KEY = 'katha_reviewer_assignments';
const REVIEWER_POOL_KEY = 'katha_reviewer_pool';
const REVIEWER_SLOT_KEY = 'katha_reviewer_slot';

export interface ReviewDevSeedResult {
  requestId: string;
  assignmentId: string;
  reviewerSlot: string;
  message: string;
}

function blindLabel(requestId: string): string {
  return `Manuscript #${requestId.slice(-6).toUpperCase()}`;
}

/** Exemplary Telugu + English passage notes — production quality, original fiction only */
function buildExemplaryComments(): StructuredReviewComment[] {
  return [
    {
      id: 'seed-cmt-1',
      chapter_ref: 'Chapter 1',
      scene_ref: 'Scene 1',
      paragraph_ref: '¶2',
      passage_ref: 'ఆమె తలుపు చట్రంపై చేతులు అదిమి, పాత టేకు మొక్క యొక్క గీతలను అనుభవించింది.',
      category: 'description',
      priority: 'medium',
      reason:
        'టేకు చట్రం అనుభూతి బలంగా ఉంది — ఇంటి జ్ఞాపకాన్ని శరీరం ద్వారా చూపించడం మంచి ఎంపిక. ఒక చిన్న స్పర్శ వివరం (ఉదా: పెయింట్ పొర విరిగి ఉండటం) ఈ గ్రామం యొక్క వయస్సును మరింత స్పష్టం చేస్తుంది.',
      recommendation: 'చట్రంపై ఒక తాకిడి గుర్తు లేదా పాత రంగు పొరను ఒక వాక్యంలో చేర్చండి.',
      expected_impact: 'పాఠకులు ఇంటిని వెంటనే గుర్తుంచుకుంటారు — తర్వాతి ఘర్షణలో ఈ స్థలం భారం పెరుగుతుంది.',
      reviewer_confidence: 82,
      author_resolution: 'pending',
    },
    {
      id: 'seed-cmt-2',
      chapter_ref: 'Chapter 1',
      scene_ref: 'Scene 2',
      paragraph_ref: '¶1',
      passage_ref: '"You cannot ask me to forget," he said, not raising his voice.',
      category: 'dialogue',
      priority: 'high',
      reason:
        'The restraint in his voice is excellent craft — conflict without shouting. The line still rests on a general idea of memory; a concrete personal detail would make the refusal land harder.',
      recommendation:
        'Anchor the refusal to one shared memory (a festival night, a river crossing) so the reader feels the history between them.',
      expected_impact: 'Raises emotional stakes without adding length; improves re-read value of the scene.',
      reviewer_confidence: 88,
      author_resolution: 'pending',
    },
    {
      id: 'seed-cmt-3',
      chapter_ref: 'Chapter 1',
      scene_ref: 'Scene 3',
      paragraph_ref: '¶2',
      passage_ref: 'She folded the letter once, then twice, as if compressing the choice into something small enough to carry.',
      category: 'plot',
      priority: 'medium',
      reason:
        'Beautiful physical metaphor for decision-making. Consider whether the letter\'s contents have been shown clearly enough before this gesture — readers may not yet know what choice is being folded away.',
      recommendation: 'One short clause naming the choice (stay / leave / warn the village) before or after the fold.',
      expected_impact: 'Keeps the image while removing ambiguity about the story engine of chapter 1.',
      reviewer_confidence: 79,
      author_resolution: 'pending',
    },
  ];
}

function boostReviewerPool(): void {
  try {
    const raw = localStorage.getItem(REVIEWER_POOL_KEY);
    if (!raw) return;
    const pool = JSON.parse(raw) as Array<Record<string, unknown>>;
    const boosted = pool.map((m, i) => {
      const slot = String(m.pool_slot ?? `slot-${i + 1}`);
      if (slot === 'slot-1') {
        // Modest, earned-looking track record — not a fake master with 48 reviews.
        return {
          ...m,
          rqi: roundRqi(DEV_SANDBOX_RQI),
          council_level: 'certified_reviewer',
          reputation_tier: 'silver',
          review_experience_count: 4,
          conduct_score: 88,
          agreement_score: 84,
          is_available: true,
        };
      }
      return { ...m, is_available: true, rqi: roundRqi(Number(m.rqi) || 0) };
    });
    localStorage.setItem(REVIEWER_POOL_KEY, JSON.stringify(boosted));
  } catch { /* ignore */ }
}

/** Wipe demo review state and plant a ready-to-open assignment for slot-1 */
export function seedReviewDevScenario(authorId = 'dev-author'): ReviewDevSeedResult {
  const now = new Date().toISOString();
  const requestId = `pr-dev-${DEV_REVIEW_SEED_VERSION}-${Date.now().toString(36)}`;
  const assignmentId = `asgn-${requestId}-0`;

  boostReviewerPool();
  localStorage.setItem(REVIEWER_SLOT_KEY, 'slot-1');

  const sqiBefore = computeStoryQualityIndex(demoSqiFromTrust(5200));
  const exemplary = buildExemplaryComments();

  const request: PeerReviewRequest = {
    id: requestId,
    author_id: authorId,
    story_id: DEMO_REVIEW_MANUSCRIPT_TE.id,
    story_title: DEMO_REVIEW_MANUSCRIPT_TE.title,
    package_fee_inr: 0,
    mode: 'volunteer',
    status: 'in_review',
    professional_role: 'literary_reviewer',
    story_genre: 'mythology',
    preferred_roles: [],
    double_blind: true,
    escrow_status: 'none',
    reviews_received: 0,
    reviewers_matched: REVIEW_PACKAGE.reviewerCount,
    matching_avg_score: 88,
    sqi_before: sqiBefore,
    payment_status: 'waived',
    created_at: now,
    audit_status: 'pending',
    fraud_risk_score: 8,
    // Pre-seeded author-facing sample when demo is fully played through;
    // empty while assignment is in progress so inbox doesn't double-count.
    structured_comments: [],
  };

  const manuscriptLabel = blindLabel(requestId);

  const readyAssignment: ReviewerAssignment = {
    id: assignmentId,
    request_id: requestId,
    reviewer_pool_id: 'rev-pool-1',
    reviewer_slot: 'slot-1',
    matching_score: 88,
    status: 'accepted',
    manuscript_label: manuscriptLabel,
    professional_role: 'literary_reviewer',
    story_genre: 'mythology',
    mode: 'volunteer',
    payout_inr: 0,
    invited_at: now,
    accepted_at: now,
  };

  const slot2Assignment: ReviewerAssignment = {
    id: `asgn-${requestId}-1`,
    request_id: requestId,
    reviewer_pool_id: 'rev-pool-2',
    reviewer_slot: 'slot-2',
    matching_score: 82,
    status: 'invited',
    manuscript_label: manuscriptLabel,
    professional_role: 'literary_reviewer',
    story_genre: 'mythology',
    mode: 'volunteer',
    payout_inr: 0,
    invited_at: now,
  };

  const slot3Assignment: ReviewerAssignment = {
    id: `asgn-${requestId}-2`,
    request_id: requestId,
    reviewer_pool_id: 'rev-pool-3',
    reviewer_slot: 'slot-3',
    matching_score: 79,
    status: 'invited',
    manuscript_label: manuscriptLabel,
    professional_role: 'literary_reviewer',
    story_genre: 'mythology',
    mode: 'volunteer',
    payout_inr: 0,
    invited_at: now,
  };

  // Store exemplary notes under a companion key for demo author feedback path
  // without duplicating into live structured_comments until submit merges them.
  try {
    localStorage.setItem(
      `katha_demo_exemplary_comments_${requestId}`,
      JSON.stringify(exemplary),
    );
  } catch { /* ignore */ }

  localStorage.setItem(PEER_REVIEWS_KEY, JSON.stringify([request]));
  localStorage.setItem(
    REVIEWER_ASSIGNMENTS_KEY,
    JSON.stringify([readyAssignment, slot2Assignment, slot3Assignment]),
  );

  markDevSeedApplied();

  return {
    requestId,
    assignmentId,
    reviewerSlot: 'slot-1',
    message: `Dev scenario ready. Slot 1 has an accepted review — open the workspace from Reviewer inbox.`,
  };
}

export function resetReviewDevData(): void {
  try {
    localStorage.removeItem(PEER_REVIEWS_KEY);
    localStorage.removeItem(REVIEWER_ASSIGNMENTS_KEY);
    localStorage.removeItem(REVIEWER_POOL_KEY);
    localStorage.removeItem('katha_review_dev_seed_v');
  } catch { /* ignore */ }
}
