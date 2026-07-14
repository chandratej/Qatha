/**
 * Platform API — migration 014/017 wiring (ARC-01 Wave 1)
 * Engineering Council: single monolith module before microservices.
 */

import { Router } from 'express';
import { requireAuth, getAuthenticatedUserId } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
/** Keep in sync with packages/shared/tags.ts SEED_COMMUNITY_TAGS */
const SEED_COMMUNITY_TAGS = [
  'found_family', 'enemies_to_lovers', 'time_travel', 'village', 'hyderabad',
  'haunted_house', 'dark_humor', 'second_chance', 'forbidden_love', 'revenge',
  'coming_of_age', 'political', 'supernatural', 'courtroom', 'medical',
];
import {
  listPeerReviewRequests,
  listAssignmentsForSlot,
  getAssignmentById,
  getPeerReviewRequestById,
  createPeerReviewRequest,
  getAuthorReviewFeedback,
  getReviewerFeedbackBundles,
  resolveAuthorComment,
  replyToReviewComment,
  acknowledgePeerReviewDecision,
  resubmitPeerReviewForRevision,
  cancelPeerReviewForStoryWithdrawal,
  transitionAssignment,
  seedPeerReviewMockIfEmpty,
  getCouncilAuditQueue,
  clearCouncilAudit,
} from '../services/peerReviewStore.js';
import { loadReviewerPool, getReviewerPoolSummary } from '../services/reviewerPoolStore.js';
import {
  getReviewerOnboarding,
  applyToReviewerPool,
  listPendingReviewerApplications,
  moderateReviewerApplication,
  completeReviewerTraining,
  submitTrialReview,
  setReviewerAvailability,
} from '../services/reviewerProfileStore.js';
import { getReviewerDashboardStats } from '../services/reviewerDashboardStore.js';
import { listReputationEvents } from '../services/reputationEventStore.js';
import {
  createModerationCase,
  listModerationCases,
  submitAppeal,
  assignModerationCase,
  resolveModerationCase,
} from '../services/moderationCaseStore.js';
import { getReviewDraft, saveReviewDraft } from '../services/reviewDraftStore.js';
import { loadBlindManuscriptForAssignment } from '../services/reviewManuscriptStore.js';
import {
  ensureAdvisorySuggestions,
  respondToAdvisorySuggestion,
} from '../services/aiReviewAdvisoryStore.js';
import { isAdvisoryAiLive } from '../services/aiAdvisoryProvider.js';
import { getReviewSlaOpsDashboard } from '../services/reviewSlaOpsStore.js';
import {
  getReviewAnalyticsSummary,
  exportReviewAnalyticsWarehouse,
} from '../services/reviewAnalyticsEventStore.js';
import { getAdvisoryGovernanceDashboard } from '../services/aiGovernanceStore.js';
import { listAuditLogEntries, getAuditLogSummary } from '../services/auditLogStore.js';
import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationsStore.js';
import {
  getCreatorNotificationPrefs,
  updateCreatorNotificationPrefs,
} from '../services/creatorNotificationPrefsStore.js';
import { createAppError } from '../middleware/errorHandler.js';
import { platformWriteRateLimit } from '../middleware/platformWriteRateLimit.js';
import {
  listEvents,
  getEventById,
  createEvent,
  registerForEvent,
  getRegistration,
  listRegistrationsForUser,
  submitToEvent,
  acceptsRegistration,
  escrowSplit,
  getEventRevenueSummary,
} from '../services/eventsStore.js';
import {
  getCurrentRules,
  getRulesByVersion,
  listRulesVersions,
  recordRulesAcceptance,
  isValidRulesVersion,
  CURRENT_COMPETITION_RULES_VERSION,
} from '../services/competitionRulesStore.js';

function slugifyTag(label) {
  return String(label).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export const platformRouter = Router();

/** Preserve AppError status codes (401/400) instead of wrapping as 500. */
function forwardRouteError(err, next) {
  if (err?.status && err?.code) return next(err);
  return next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
}

platformRouter.use(requireAuth());
platformRouter.use(platformWriteRateLimit());

platformRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    mock_mode: isMockMode(),
    modules: ['peer_reviews', 'events', 'tags', 'notifications', 'reviewer_pool'],
  });
});

/** Tags — read official seed; write via tag_requests when Supabase live */
platformRouter.get('/tags', async (_req, res, next) => {
  try {
    const seedTags = () => SEED_COMMUNITY_TAGS.map((slug) => ({
      id: slug,
      slug,
      label: slug.replace(/_/g, ' '),
      tag_kind: 'community',
      is_official: true,
      usage_count: 0,
    }));

    if (isMockMode()) {
      return res.json({ tags: seedTags(), mock: true });
    }
    const { data, error } = await supabase.from('tags').select('*').order('usage_count', { ascending: false }).limit(200);
    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ tags: data?.length ? data : seedTags() });
  } catch (err) {
    next(err);
  }
});

platformRouter.get('/tags/requests', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (isMockMode()) {
      return res.json({ requests: [], mock: true });
    }
    const { data, error } = await supabase
      .from('tag_requests')
      .select('*')
      .eq('requester_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ requests: data || [] });
  } catch (err) {
    next(err);
  }
});

platformRouter.post('/tags/request', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const label = String(req.body?.label || '').trim();
    if (!label) throw createAppError('BAD_REQUEST', 'label required', 400);
    const proposed_slug = slugifyTag(label);

    if (isMockMode()) {
      return res.json({
        request: {
          id: `tag-req-${Date.now()}`,
          requester_id: userId,
          proposed_label: label,
          proposed_slug,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
        mock: true,
      });
    }

    const { data, error } = await supabase.from('tag_requests').insert({
      requester_id: userId,
      proposed_label: label,
      proposed_slug,
      status: 'pending',
    }).select('*').single();
    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.status(201).json({ request: data });
  } catch (err) {
    next(err);
  }
});

/** Events — same store as /api/events (ARC-01) */
platformRouter.get('/events', async (_req, res, next) => {
  try {
    const events = await listEvents();
    res.json({ events });
  } catch (err) {
    next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.get('/events/revenue/summary', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const summary = await getEventRevenueSummary(userId);
    res.json({ summary });
  } catch (err) {
    next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.get('/competition-rules/current', (_req, res) => {
  res.json({ rules: getCurrentRules(), version: CURRENT_COMPETITION_RULES_VERSION });
});

platformRouter.get('/competition-rules/versions', (_req, res) => {
  res.json({ versions: listRulesVersions(), current: CURRENT_COMPETITION_RULES_VERSION });
});

platformRouter.get('/competition-rules/:version', (req, res, next) => {
  try {
    const rules = getRulesByVersion(req.params.version);
    if (!rules) throw createAppError('NOT_FOUND', 'Competition rules version not found', 404);
    res.json({ rules });
  } catch (err) {
    next(err instanceof Error && !err.status ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.get('/events/registrations/me', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const registrations = await listRegistrationsForUser(userId);
    res.json({ registrations });
  } catch (err) {
    next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.get('/events/:id', async (req, res, next) => {
  try {
    const event = await getEventById(req.params.id);
    if (!event) throw createAppError('NOT_FOUND', 'Event not found', 404);
    const fee = event.entry_fee_inr || 0;
    res.json({
      event,
      escrowPreview: fee > 0 ? escrowSplit(fee) : null,
      acceptsRegistration: acceptsRegistration(event),
    });
  } catch (err) {
    next(err instanceof Error && !err.status ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.post('/events', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const event = await createEvent(userId, req.body);
    res.status(201).json({ event });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/events/:id/register', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const rulesVersion = req.body?.rules_version ?? CURRENT_COMPETITION_RULES_VERSION;
    if (!isValidRulesVersion(rulesVersion)) {
      throw createAppError('BAD_REQUEST', `Unsupported competition rules version: ${rulesVersion}`, 400);
    }
    if (!req.body?.rules_accepted) {
      throw createAppError('BAD_REQUEST', 'Competition rules acceptance is required before registration', 400);
    }
    recordRulesAcceptance({ eventId: req.params.id, userId, rulesVersion });
    const result = await registerForEvent(userId, req.params.id, { rules_version: rulesVersion });
    res.status(result.alreadyRegistered ? 200 : 201).json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/events/:id/registration/me', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const registration = await getRegistration(req.params.id, userId);
    res.json({ registration });
  } catch (err) {
    next(err);
  }
});

platformRouter.post('/events/:id/submit', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await submitToEvent(userId, req.params.id, req.body || {});
    res.status(201).json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/reviewer-onboarding/me', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const onboarding = await getReviewerOnboarding(userId);
    res.json({ onboarding });
  } catch (err) {
    next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.post('/reviewer-onboarding/apply', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { genres, languages, motivation, agreement_accepted, agreement_version } = req.body || {};
    const result = await applyToReviewerPool(userId, {
      genres,
      languages,
      motivation,
      agreement_accepted,
      agreement_version,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/reviewer-onboarding/pending', requireRole('moderator', 'admin'), async (_req, res, next) => {
  try {
    const applications = await listPendingReviewerApplications();
    res.json({ applications });
  } catch (err) {
    next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.post('/reviewer-onboarding/:userId/moderate', requireRole('moderator', 'admin'), async (req, res, next) => {
  try {
    const moderatorId = getAuthenticatedUserId(req);
    const { decision, notes } = req.body || {};
    const result = await moderateReviewerApplication(
      moderatorId,
      req.params.userId,
      decision,
      notes,
    );
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/reviewer-onboarding/complete-training', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await completeReviewerTraining(userId);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/reviewer-onboarding/trial-review', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await submitTrialReview(userId, req.body || {});
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/reviewer-onboarding/certify', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await submitTrialReview(userId, req.body || {});
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/reviewer-dashboard/stats', async (req, res, next) => {
  try {
    const slot = String(req.query.reviewer_slot || 'slot-1');
    const stats = await getReviewerDashboardStats(slot);
    res.json({ stats });
  } catch (err) {
    next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.patch('/reviewer-onboarding/availability', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { is_available: isAvailable } = req.body || {};
    const result = await setReviewerAvailability(userId, isAvailable !== false);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/reviewer-pool', async (_req, res, next) => {
  try {
    const pool = await loadReviewerPool();
    res.json({ pool });
  } catch (err) {
    next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.get('/reviewer-pool/summary', async (_req, res, next) => {
  try {
    const summary = await getReviewerPoolSummary();
    res.json({ summary });
  } catch (err) {
    next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.get('/notifications', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const notifications = await listNotificationsForUser(userId);
    res.json({ notifications });
  } catch (err) {
    forwardRouteError(err, next);
  }
});

platformRouter.post('/notifications/read-all', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const marked = await markAllNotificationsRead(userId);
    res.json({ marked });
  } catch (err) {
    forwardRouteError(err, next);
  }
});

platformRouter.post('/notifications/:id/read', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const notification = await markNotificationRead(userId, req.params.id);
    res.json({ notification });
  } catch (err) {
    forwardRouteError(err, next);
  }
});

platformRouter.get('/notification-preferences', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const preferences = await getCreatorNotificationPrefs(userId);
    res.json({ preferences });
  } catch (err) {
    next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

platformRouter.patch('/notification-preferences', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { domains } = req.body || {};
    if (!domains || typeof domains !== 'object') {
      throw createAppError('BAD_REQUEST', 'domains object required', 400);
    }
    const preferences = await updateCreatorNotificationPrefs(userId, domains);
    res.json({ preferences });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/peer-reviews/council-audit', async (_req, res, next) => {
  try {
    const entries = await getCouncilAuditQueue();
    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

platformRouter.post('/peer-reviews/:requestId/council-audit/clear', async (req, res, next) => {
  try {
    const request = await clearCouncilAudit(req.params.requestId);
    res.json({ request });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/peer-reviews', async (req, res, next) => {
  try {
    const authorId = getAuthenticatedUserId(req);
    const {
      story_id: storyId,
      story_title: storyTitle,
      mode = 'volunteer',
      package_fee_inr: packageFeeInr = 0,
      preferred_roles: preferredRoles = [],
      professional_role: professionalRole,
      story_genre: storyGenre,
      author_trust_level: authorTrustLevel,
      mark_paid: markPaid,
    } = req.body || {};

    const result = await createPeerReviewRequest(authorId, {
      storyId,
      storyTitle,
      mode,
      packageFeeInr: Number(packageFeeInr) || 0,
      preferredRoles,
      professionalRole,
      storyGenre,
      authorTrustLevel,
      markPaid: markPaid !== false,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/peer-reviews', async (req, res, next) => {
  try {
    seedPeerReviewMockIfEmpty();
    const authorId = (req.query.author_id || getAuthenticatedUserId(req)) ?? undefined;
    const requests = await listPeerReviewRequests(authorId);
    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

platformRouter.get('/peer-reviews/author-feedback', async (req, res, next) => {
  try {
    const authorId = (req.query.author_id || getAuthenticatedUserId(req)) ?? undefined;
    const bundles = await getAuthorReviewFeedback(authorId);
    res.json({ bundles });
  } catch (err) {
    next(err);
  }
});

platformRouter.get('/peer-reviews/reviewer-feedback', async (req, res, next) => {
  try {
    seedPeerReviewMockIfEmpty();
    const slot = String(req.query.reviewer_slot || 'slot-1');
    const bundles = await getReviewerFeedbackBundles(slot);
    res.json({ bundles });
  } catch (err) {
    next(err);
  }
});

platformRouter.get('/peer-reviews/assignments', async (req, res, next) => {
  try {
    seedPeerReviewMockIfEmpty();
    const slot = String(req.query.reviewer_slot || 'slot-1');
    const assignments = await listAssignmentsForSlot(slot);
    res.json({ assignments });
  } catch (err) {
    next(err);
  }
});

platformRouter.get('/peer-reviews/assignments/:assignmentId', async (req, res, next) => {
  try {
    const assignment = await getAssignmentById(req.params.assignmentId);
    if (!assignment) throw createAppError('NOT_FOUND', 'Assignment not found', 404);
    const requests = await listPeerReviewRequests();
    const request = requests.find((r) => r.id === assignment.request_id);
    if (!request) throw createAppError('NOT_FOUND', 'Review request not found', 404);
    res.json({ assignment, request });
  } catch (err) {
    next(err);
  }
});

platformRouter.get('/peer-reviews/assignments/:assignmentId/draft', async (req, res, next) => {
  try {
    const slot = String(req.query.reviewer_slot || 'slot-1');
    const result = await getReviewDraft(req.params.assignmentId, slot);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.put('/peer-reviews/assignments/:assignmentId/draft', async (req, res, next) => {
  try {
    const slot = String(req.body.reviewer_slot || 'slot-1');
    const { draft } = req.body || {};
    if (!draft || typeof draft !== 'object') {
      throw createAppError('BAD_REQUEST', 'draft payload required', 400);
    }
    const result = await saveReviewDraft(req.params.assignmentId, slot, draft);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/peer-reviews/assignments/:assignmentId/manuscript', async (req, res, next) => {
  try {
    const slot = String(req.query.reviewer_slot || 'slot-1');
    const assignment = await getAssignmentById(req.params.assignmentId);
    if (!assignment) throw createAppError('NOT_FOUND', 'Assignment not found', 404);
    if (assignment.reviewer_slot !== slot) {
      throw createAppError('FORBIDDEN', 'This invitation is assigned to a different reviewer slot', 403);
    }
    const request = await getPeerReviewRequestById(assignment.request_id);
    if (!request) throw createAppError('NOT_FOUND', 'Review request not found', 404);
    const manuscript = await loadBlindManuscriptForAssignment(assignment, request);
    res.json({ manuscript });
  } catch (err) {
    next(err);
  }
});

platformRouter.post('/peer-reviews/assignments/:assignmentId/start', async (req, res, next) => {
  try {
    const slot = String(req.body.reviewer_slot || 'slot-1');
    const assignment = await transitionAssignment(req.params.assignmentId, slot, 'open_workspace');
    res.json({ assignment });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/peer-reviews/assignments/:assignmentId/accept', async (req, res, next) => {
  try {
    const slot = String(req.body.reviewer_slot || 'slot-1');
    const assignment = await transitionAssignment(req.params.assignmentId, slot, 'accept');
    res.json({ assignment });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/peer-reviews/assignments/:assignmentId/decline', async (req, res, next) => {
  try {
    const slot = String(req.body.reviewer_slot || 'slot-1');
    const assignment = await transitionAssignment(req.params.assignmentId, slot, 'decline');
    res.json({ assignment });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/peer-reviews/assignments/:assignmentId/submit', async (req, res, next) => {
  try {
    const slot = String(req.body.reviewer_slot || 'slot-1');
    const { review_summary, structured_comments, majority_decision } = req.body || {};
    if (!majority_decision?.trim() && !review_summary?.majority_decision?.trim()) {
      throw createAppError('BAD_REQUEST', 'Council decision required before submit', 400);
    }
    const assignment = await transitionAssignment(req.params.assignmentId, slot, 'submit', {
      review_summary: review_summary || { majority_decision },
      structured_comments: structured_comments || [],
    });
    res.json({ assignment });
  } catch (err) {
    next(err instanceof Error && !err.status ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/peer-reviews/:requestId', async (req, res, next) => {
  try {
    const request = await getPeerReviewRequestById(req.params.requestId);
    if (!request) throw createAppError('NOT_FOUND', 'Review request not found', 404);
    res.json({ request });
  } catch (err) {
    next(err);
  }
});

platformRouter.post('/peer-reviews/:requestId/comments/:commentId/resolve', async (req, res, next) => {
  try {
    const authorId = getAuthenticatedUserId(req);
    const { resolution } = req.body || {};
    const request = await resolveAuthorComment(
      req.params.requestId,
      authorId,
      req.params.commentId,
      resolution,
    );
    res.json({ request });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/peer-reviews/:requestId/acknowledge', async (req, res, next) => {
  try {
    const authorId = getAuthenticatedUserId(req);
    const { satisfaction_rating: satisfactionRating } = req.body || {};
    const request = await acknowledgePeerReviewDecision(req.params.requestId, authorId, {
      satisfaction_rating: satisfactionRating,
    });
    res.json({ request });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/peer-reviews/:requestId/resubmit', async (req, res, next) => {
  try {
    const authorId = getAuthenticatedUserId(req);
    const { revision_notes: revisionNotes } = req.body || {};
    const request = await resubmitPeerReviewForRevision(req.params.requestId, authorId, {
      revision_notes: revisionNotes,
    });
    res.json({ request });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/reputation-events', async (req, res, next) => {
  try {
    const profileId = getAuthenticatedUserId(req);
    const events = await listReputationEvents(profileId);
    res.json({ events });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/moderation-cases', async (req, res, next) => {
  try {
    const reporterId = getAuthenticatedUserId(req);
    const caseRow = await createModerationCase({
      ...req.body,
      reporter_id: reporterId,
    });
    res.status(201).json({ case: caseRow });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/moderation-cases', async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const caseType = req.query.case_type ? String(req.query.case_type) : undefined;
    const openOnly = req.query.open_only === 'true';
    const cases = await listModerationCases({ status, case_type: caseType, open_only: openOnly });
    res.json({ cases });
  } catch (err) {
    next(err);
  }
});

platformRouter.post('/peer-reviews/:requestId/appeal', async (req, res, next) => {
  try {
    const authorId = getAuthenticatedUserId(req);
    const { reason } = req.body || {};
    const caseRow = await submitAppeal({
      reporter_id: authorId,
      request_id: req.params.requestId,
      reason,
    });
    res.status(201).json({ case: caseRow });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/moderation-cases/:caseId/assign', requireRole('moderator', 'admin'), async (req, res, next) => {
  try {
    const moderatorId = getAuthenticatedUserId(req);
    const caseRow = await assignModerationCase(req.params.caseId, moderatorId);
    res.json({ case: caseRow });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/moderation-cases/:caseId/resolve', requireRole('moderator', 'admin'), async (req, res, next) => {
  try {
    const moderatorId = getAuthenticatedUserId(req);
    const { status, notes } = req.body || {};
    const caseRow = await resolveModerationCase(req.params.caseId, status, notes, moderatorId);
    res.json({ case: caseRow });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/ops/sla-dashboard', requireRole('moderator', 'admin'), async (_req, res, next) => {
  try {
    const dashboard = await getReviewSlaOpsDashboard();
    res.json({ dashboard });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/ops/analytics-summary', requireRole('moderator', 'admin'), async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    const summary = await getReviewAnalyticsSummary({ days });
    res.json({ summary });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/ops/analytics-export', requireRole('moderator', 'admin'), async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 90;
    const limit = Math.min(Number(req.query.limit) || 2000, 5000);
    const warehouse = await exportReviewAnalyticsWarehouse({ days, limit });
    if (req.query.format === 'ndjson') {
      res.type('application/x-ndjson');
      for (const row of warehouse.records) {
        res.write(`${JSON.stringify(row)}\n`);
      }
      return res.end();
    }
    res.json({ warehouse });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/ops/audit-log', requireRole('moderator', 'admin'), async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const entityType = req.query.entity_type ? String(req.query.entity_type) : undefined;
    const entityId = req.query.entity_id ? String(req.query.entity_id) : undefined;
    const [entries, summary] = await Promise.all([
      listAuditLogEntries({ limit, entityType, entityId }),
      getAuditLogSummary({ days: Number(req.query.days) || 30 }),
    ]);
    res.json({ entries, summary });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/ops/advisory-governance', requireRole('moderator', 'admin'), async (_req, res, next) => {
  try {
    const dashboard = await getAdvisoryGovernanceDashboard();
    res.json({ dashboard });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/peer-reviews/:requestId/cancel', async (req, res, next) => {
  try {
    const authorId = getAuthenticatedUserId(req);
    const { reason, withdrawal_reason } = req.body || {};
    const result = await cancelPeerReviewForStoryWithdrawal(
      req.params.requestId,
      authorId,
      { reason, withdrawal_reason },
    );
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.get('/assignments/:assignmentId/advisory-suggestions', async (req, res, next) => {
  try {
    const reviewerSlot = String(req.query.reviewer_slot || '');
    if (!reviewerSlot) throw createAppError('BAD_REQUEST', 'reviewer_slot required', 400);
    const result = await ensureAdvisorySuggestions(req.params.assignmentId, reviewerSlot);
    res.json({
      suggestions: result.suggestions,
      generated: result.generated,
      advisory_ai_live: isAdvisoryAiLive(),
    });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/advisory-suggestions/:suggestionId/respond', async (req, res, next) => {
  try {
    const { action } = req.body || {};
    const suggestion = await respondToAdvisorySuggestion(req.params.suggestionId, action);
    res.json({ suggestion });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

platformRouter.post('/peer-reviews/:requestId/comments/:commentId/reply', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { body, role } = req.body || {};
    const thread = await replyToReviewComment(
      req.params.requestId,
      userId,
      req.params.commentId,
      body,
      role === 'reviewer' ? 'reviewer' : 'author',
    );
    res.status(201).json({ thread });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});