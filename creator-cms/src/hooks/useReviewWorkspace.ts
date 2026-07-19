import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PeerReviewRequest, ReviewerAssignment } from '../types/platform';
import type {
  BlindManuscript,
  ReviewComment,
  ReviewWorkspaceDraft,
  ReviewWorkspacePrefs,
  TextSelectionAnchor,
  TrackChangeRecord,
} from '../types/reviewWorkspace';
import {
  computeMetrics,
  duplicateCommentWarning,
  loadReviewDraft,
  mergeReviewDraft,
  predictRqiGain,
  saveReviewDraft,
  syncChecklistFromComments,
} from '../lib/reviewWorkspaceStore';
import { buildStoryIntelligence, loadBlindManuscript } from '../lib/reviewManuscript';
import { platformApi } from '../lib/platformApi';
import { usePlatformBackend } from '../lib/platformBackend';
import { getReviewerPool } from '../lib/platformStore';
import { DEV_SANDBOX_RQI, isReviewDevSandbox } from '../lib/reviewDevSandbox';

export interface UseReviewWorkspaceArgs {
  assignment: ReviewerAssignment;
  request: PeerReviewRequest;
  reviewerSlot: string;
}

export function useReviewWorkspace({ assignment, request, reviewerSlot }: UseReviewWorkspaceArgs) {
  const useServer = usePlatformBackend();
  const [draft, setDraft] = useState<ReviewWorkspaceDraft>(() =>
    loadReviewDraft(assignment.id, request.id),
  );
  const [manuscript, setManuscript] = useState<BlindManuscript>(() =>
    loadBlindManuscript(request, assignment),
  );
  const [manuscriptLoading, setManuscriptLoading] = useState(useServer);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentFilter, setCommentFilter] = useState<'all' | 'open' | 'resolved' | 'pinned' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selection, setSelection] = useState<TextSelectionAnchor | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionStart = useRef(Date.now());
  const serverSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = useRef(draft);
  latestDraftRef.current = draft;

  useEffect(() => {
    let cancelled = false;
    if (useServer) {
      platformApi.getReviewerManuscript(assignment.id, reviewerSlot)
        .then(({ manuscript: m }) => { if (!cancelled) setManuscript(m); })
        .catch(() => { if (!cancelled) setManuscript(loadBlindManuscript(request, assignment)); })
        .finally(() => { if (!cancelled) setManuscriptLoading(false); });

      platformApi.getReviewDraft(assignment.id, reviewerSlot)
        .then(({ draft: remote, saved_at }) => {
          if (cancelled || !remote) return;
          const merged = mergeReviewDraft(assignment.id, request.id, remote, saved_at);
          setDraft(merged);
          saveReviewDraft(merged);
        })
        .catch(() => { /* local fallback */ });
    }
    return () => { cancelled = true; };
  }, [assignment.id, request.id, reviewerSlot, useServer, request, assignment]);

  const storyIntel = useMemo(() => buildStoryIntelligence(request), [request]);

  const reviewerProfile = useMemo(() => {
    const pool = getReviewerPool();
    const member = pool.find((p) => p.pool_slot === reviewerSlot) ?? pool[0];
    const baseRqi = isReviewDevSandbox() && reviewerSlot === 'slot-1'
      ? DEV_SANDBOX_RQI
      : (member?.rqi ?? 62);
    const reviewCount = member?.review_experience_count ?? 0;
    const rqi = Math.round(baseRqi);
    return {
      rqi,
      potentialRqi: Math.min(100, Math.round(rqi + predictRqiGain(draft.comments))),
      councilLevel: member?.council_level ?? 'candidate',
      expertise: member?.genre_expertise ?? [assignment.story_genre],
      acceptanceRate: reviewCount > 0 ? 84 : 0,
      reviewStreak: Math.min(reviewCount, 7),
      // Earned labels only — no default max-reputation for new reviewers
      badges: reviewCount >= 5
        ? ['Plot Analyst'].concat(reviewCount >= 8 ? ['Dialogue Craft'] : [])
        : (reviewCount >= 1 ? ['First Review'] : []),
    };
  }, [reviewerSlot, assignment.story_genre, draft.comments]);

  const currentChapter = useMemo(
    () => manuscript.chapters.find((c) => c.num === draft.currentChapter) ?? manuscript.chapters[0],
    [manuscript, draft.currentChapter],
  );

  const filteredComments = useMemo(() => {
    let list = draft.comments;
    if (commentFilter === 'open') list = list.filter((c) => c.status === 'open');
    if (commentFilter === 'resolved') list = list.filter((c) => c.status === 'resolved');
    if (commentFilter === 'pinned') list = list.filter((c) => c.status === 'pinned');
    if (commentFilter === 'critical') list = list.filter((c) => c.priority === 'critical');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.reason.toLowerCase().includes(q)
          || c.recommendation.toLowerCase().includes(q)
          || c.category.includes(q),
      );
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [draft.comments, commentFilter, searchQuery]);

  const queueServerSave = useCallback((payload: ReviewWorkspaceDraft) => {
    if (!useServer) return;
    if (serverSaveTimer.current) clearTimeout(serverSaveTimer.current);
    serverSaveTimer.current = setTimeout(() => {
      platformApi.saveReviewDraft(assignment.id, reviewerSlot, payload).catch(() => {
        setError('Could not sync draft to server — saved locally.');
      });
    }, 1200);
  }, [assignment.id, reviewerSlot, useServer]);

  const persist = useCallback((next: ReviewWorkspaceDraft) => {
    const withChecklist = {
      ...next,
      checklist: syncChecklistFromComments(next.checklist, next.comments),
      metrics: {
        ...computeMetrics(next.comments),
        timeSpentMinutes: Math.round((Date.now() - sessionStart.current) / 60000),
      },
    };
    const saved = saveReviewDraft(withChecklist);
    setDraft(saved);
    queueServerSave(saved);
    return saved;
  }, [queueServerSave]);

  const updatePrefs = useCallback((patch: Partial<ReviewWorkspacePrefs>) => {
    setDraft((prev) => persist({ ...prev, prefs: { ...prev.prefs, ...patch } }));
  }, [persist]);

  const setChapter = useCallback((num: number) => {
    setDraft((prev) => {
      const reviewed = prev.chaptersReviewed.includes(num)
        ? prev.chaptersReviewed
        : [...prev.chaptersReviewed, num];
      const ch = manuscript.chapters.find((c) => c.num === num);
      const firstScene = ch?.scenes[0]?.id;
      return persist({
        ...prev,
        currentChapter: num,
        currentSceneId: firstScene,
        chaptersReviewed: reviewed,
      });
    });
  }, [persist, manuscript.chapters]);

  const setScene = useCallback((sceneId: string, chapterNum?: number) => {
    setDraft((prev) => {
      const chNum = chapterNum ?? prev.currentChapter;
      return persist({ ...prev, currentChapter: chNum, currentSceneId: sceneId });
    });
    requestAnimationFrame(() => {
      document.getElementById(`scene-${sceneId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [persist]);

  const addComment = useCallback((partial: Partial<ReviewComment> & Pick<ReviewComment, 'category' | 'reason'>) => {
    const now = new Date().toISOString();
    const comment: ReviewComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: partial.kind ?? 'comment',
      chapterNum: partial.chapterNum ?? draft.currentChapter,
      sceneId: partial.sceneId ?? selection?.sceneId ?? partial.anchor?.sceneId,
      paragraphIndex: partial.paragraphIndex ?? 0,
      sentenceIndex: partial.sentenceIndex,
      category: partial.category,
      priority: partial.priority ?? 'medium',
      reason: partial.reason,
      recommendation: partial.recommendation ?? '',
      expectedImpact: partial.expectedImpact ?? '',
      reviewerConfidence: partial.reviewerConfidence ?? 75,
      evidence: partial.evidence,
      relatedCommentIds: partial.relatedCommentIds ?? [],
      status: partial.status ?? 'open',
      selectedText: partial.selectedText ?? selection?.selectedText,
      anchor: partial.anchor ?? selection ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    if (duplicateCommentWarning(draft.comments, comment.reason)) {
      setError('Similar comment detected — refine your observation for higher RQI.');
    }
    setDraft((prev) => persist({ ...prev, comments: [...prev.comments, comment] }));
    setActiveCommentId(comment.id);
    setSelection(null);
    setToolbarPos(null);
    return comment;
  }, [draft.currentChapter, draft.comments, persist, selection]);

  const updateComment = useCallback((id: string, patch: Partial<ReviewComment>) => {
    setDraft((prev) => {
      const comments = prev.comments.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
      );
      return persist({ ...prev, comments });
    });
  }, [persist]);

  const toggleCommentStatus = useCallback((id: string, status: ReviewComment['status']) => {
    updateComment(id, { status });
  }, [updateComment]);

  const addTrackChange = useCallback((change: Omit<TrackChangeRecord, 'id' | 'createdAt' | 'status'>) => {
    const record: TrackChangeRecord = {
      ...change,
      id: `tc-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setDraft((prev) => persist({ ...prev, trackChanges: [...prev.trackChanges, record] }));
  }, [persist]);

  const updateSummary = useCallback((patch: Partial<ReviewWorkspaceDraft['summary']>) => {
    setDraft((prev) => persist({ ...prev, summary: { ...prev.summary, ...patch } }));
  }, [persist]);

  const toggleChecklist = useCallback((id: string) => {
    setDraft((prev) => {
      const checklist = prev.checklist.map((c) =>
        c.id === id ? { ...c, completed: !c.completed } : c,
      );
      return persist({ ...prev, checklist });
    });
  }, [persist]);

  const saveDraftNow = useCallback(() => {
    setSaving(true);
    const saved = persist(latestDraftRef.current);
    if (useServer) {
      platformApi.saveReviewDraft(assignment.id, reviewerSlot, saved)
        .catch(() => setError('Could not sync draft to server — saved locally.'))
        .finally(() => setSaving(false));
    } else {
      setTimeout(() => setSaving(false), 400);
    }
  }, [assignment.id, reviewerSlot, persist, useServer]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDraft((prev) => persist({
        ...prev,
        metrics: {
          ...computeMetrics(prev.comments),
          timeSpentMinutes: Math.round((Date.now() - sessionStart.current) / 60000),
        },
      }));
    }, 60000);
    return () => {
      window.clearInterval(timer);
      if (serverSaveTimer.current) clearTimeout(serverSaveTimer.current);
    };
  }, [persist]);

  const toStructuredComments = useCallback(() =>
    draft.comments.map((c) => ({
      id: c.id,
      chapter_ref: `Chapter ${c.chapterNum}`,
      scene_ref: c.sceneId ? `Scene ${c.sceneId}` : undefined,
      paragraph_ref: `¶${c.paragraphIndex + 1}`,
      passage_ref: c.selectedText || c.anchor?.selectedText,
      anchor_start: c.anchor?.startOffset,
      anchor_end: c.anchor?.endOffset,
      sentence_ref: c.sentenceIndex != null ? `S${c.sentenceIndex + 1}` : undefined,
      category: c.category,
      priority: c.priority === 'critical' ? 'high' as const : c.priority === 'low' ? 'low' as const : 'medium' as const,
      reason: c.reason,
      recommendation: c.recommendation,
      expected_impact: c.expectedImpact,
      reviewer_confidence: c.reviewerConfidence,
    })),
  [draft.comments]);

  return {
    draft,
    manuscript,
    manuscriptLoading,
    storyIntel,
    reviewerProfile,
    currentChapter,
    filteredComments,
    activeCommentId,
    setActiveCommentId,
    commentFilter,
    setCommentFilter,
    searchQuery,
    setSearchQuery,
    selection,
    setSelection,
    toolbarPos,
    setToolbarPos,
    saving,
    submitting,
    setSubmitting,
    error,
    setError,
    updatePrefs,
    setChapter,
    setScene,
    addComment,
    updateComment,
    toggleCommentStatus,
    addTrackChange,
    updateSummary,
    toggleChecklist,
    saveDraftNow,
    toStructuredComments,
    persist,
    assignment,
    request,
    reviewerSlot,
  };
}