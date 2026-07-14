import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { ReviewWorkspaceChrome } from '../components/reviewers/workspace/ReviewWorkspaceChrome';
import { useAuth } from '../context/AuthContext';
import { platformApi } from '../lib/platformApi';
import { useReviewWorkspace } from '../hooks/useReviewWorkspace';
import { LeftStoryNavPanel } from '../components/reviewers/workspace/LeftStoryNavPanel';
import { CenterReadingPanel } from '../components/reviewers/workspace/CenterReadingPanel';
import { RightIntelligencePanel } from '../components/reviewers/workspace/RightIntelligencePanel';
import { BottomSummaryPanel } from '../components/reviewers/workspace/BottomSummaryPanel';
import { FloatingReviewToolbar } from '../components/reviewers/workspace/FloatingReviewToolbar';
import { CommentFormDrawer } from '../components/reviewers/workspace/CommentFormDrawer';
import { ReviewCommandPalette } from '../components/reviewers/workspace/ReviewCommandPalette';
import type { PeerReviewRequest, ReviewerAssignment } from '../types/platform';
import type { CommentKind, CommentPriority, ReviewCategoryId, TextSelectionAnchor } from '../types/reviewWorkspace';
import { usesTeluguTypography } from '../lib/reviewLanguagePrefs';
import { useLocale } from '../context/LocaleContext';
import { clearReviewDraft } from '../lib/reviewWorkspaceStore';
import { useReviewLanguage } from '../components/reviewers/workspace/ReviewLanguageBar';
import '../styles/review-workspace.css';

export function ReviewWorkspace() {
  const { t } = useLocale();
  const { assignmentId = '' } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<ReviewerAssignment | null>(null);
  const [request, setRequest] = useState<PeerReviewRequest | null>(null);

  useEffect(() => {
    if (!assignmentId) return;
    let cancelled = false;
    setLoading(true);
    platformApi
      .getReviewerAssignment(assignmentId)
      .then(async ({ assignment: a, request: r }) => {
        if (!['accepted', 'in_review', 'submitted'].includes(a.status)) {
          throw new Error('OPEN_AFTER_ACCEPT');
        }
        platformApi.setLinkedReviewerSlot(a.reviewer_slot);
        let current = a;
        if (a.status === 'accepted') {
          const started = await platformApi.startReviewerAssignment(assignmentId, a.reviewer_slot);
          current = started.assignment;
        }
        if (!cancelled) {
          setAssignment(current);
          setRequest(r);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : '';
        setLoadError(
          msg === 'OPEN_AFTER_ACCEPT'
            ? t('reviewWorkspace.openAfterAccept')
            : (e instanceof Error ? e.message : t('reviewWorkspace.loadFailed')),
        );
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [assignmentId, user?.id, t]);

  if (loading) {
    return (
      <div className="rw-shell rw-shell--premium rw-shell--loading" data-katha-mode="creation">
        <p className="rw-loading-text" role="status" aria-live="polite">{t('reviewWorkspace.opening')}</p>
      </div>
    );
  }

  if (loadError || !assignment || !request) {
    return (
      <div className="rw-shell rw-shell--premium rw-shell--error" data-katha-mode="creation">
        <p className="cms-error-text">{loadError ?? t('reviewWorkspace.assignmentNotFound')}</p>
        <Link to="/reviewers" className="katha-cta katha-cta--soft">{t('reviewWorkspace.backToInbox')}</Link>
      </div>
    );
  }

  return (
    <ReviewWorkspaceLoaded
      assignment={assignment}
      request={request}
      assignmentId={assignmentId}
    />
  );
}

function ReviewWorkspaceLoaded({
  assignment,
  request,
  assignmentId,
}: {
  assignment: ReviewerAssignment;
  request: PeerReviewRequest;
  assignmentId: string;
}) {
  const { t } = useLocale();
  const reviewerSlot = assignment.reviewer_slot;
  const isSubmitted = assignment.status === 'submitted';
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(() => {
    try {
      return localStorage.getItem('katha_rw_guide_seen') !== '1';
    } catch {
      return true;
    }
  });
  const [pendingAction, setPendingAction] = useState<{
    kind: CommentKind;
    category: ReviewCategoryId;
    priority: CommentPriority;
  } | null>(null);
  const [scrollToCommentId, setScrollToCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (!scrollToCommentId) return;
    const t = window.setTimeout(() => setScrollToCommentId(null), 1200);
    return () => window.clearTimeout(t);
  }, [scrollToCommentId]);

  const ws = useReviewWorkspace({
    assignment,
    request,
    reviewerSlot,
  });

  const { language: reviewLang } = useReviewLanguage();
  const teluguShell = usesTeluguTypography(reviewLang);

  const chapters = ws.manuscriptLoading ? [] : ws.manuscript.chapters;
  const chapterIndex = chapters.findIndex((c) => c.num === ws.draft.currentChapter);

  const navOpen = !ws.draft.prefs.leftPanelCollapsed;
  const notesOpen = !ws.draft.prefs.rightPanelCollapsed;
  const summaryOpen = !ws.draft.prefs.bottomPanelCollapsed;
  const sheetOpen = navOpen || notesOpen || summaryOpen;

  const closeSheets = useCallback(() => {
    ws.updatePrefs({
      leftPanelCollapsed: true,
      rightPanelCollapsed: true,
      bottomPanelCollapsed: true,
      focusMode: true,
    });
  }, [ws]);

  const handleTextSelect = useCallback((anchor: TextSelectionAnchor, rect: DOMRect) => {
    ws.setSelection(anchor);
    ws.setToolbarPos({
      top: Math.min(rect.bottom + 8, window.innerHeight - 120),
      left: Math.max(12, Math.min(rect.left, window.innerWidth - 320)),
    });
  }, [ws]);

  const openDrawerForAction = useCallback((opts: {
    kind: CommentKind;
    category: ReviewCategoryId;
    priority: CommentPriority;
  }) => {
    setPendingAction(opts);
    setDrawerOpen(true);
    ws.setToolbarPos(null);
  }, [ws]);

  const goChapter = useCallback((delta: number) => {
    const idx = chapters.findIndex((c) => c.num === ws.draft.currentChapter);
    const next = chapters[idx + delta];
    if (next) ws.setChapter(next.num);
  }, [chapters, ws]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitted) {
      ws.setError(t('reviewWorkspace.alreadySubmitted'));
      return;
    }
    if (!ws.draft.summary.decision) {
      ws.setError(t('reviewWorkspace.selectDecision'));
      ws.updatePrefs({ bottomPanelCollapsed: false, focusMode: false });
      return;
    }
    ws.setSubmitting(true);
    ws.setError(null);
    try {
      await platformApi.submitReviewerAssignment(assignmentId, reviewerSlot, {
        structured_comments: ws.toStructuredComments(),
        majority_decision: ws.draft.summary.decision,
        review_summary: {
          overall_review: ws.draft.summary.overallReview,
          strengths: ws.draft.summary.strengths,
          weaknesses: ws.draft.summary.weaknesses,
          recommendation: ws.draft.summary.recommendation,
          majority_decision: ws.draft.summary.decision,
        },
      });
      clearReviewDraft(assignmentId);
      navigate('/reviewers', { state: { message: 'Review submitted to the Reviewer Pool.' } });
    } catch (e) {
      ws.setError(e instanceof Error ? e.message : t('reviewWorkspace.submitFailed'));
      ws.updatePrefs({ bottomPanelCollapsed: false, focusMode: false });
    } finally {
      ws.setSubmitting(false);
    }
  }, [ws, assignmentId, reviewerSlot, navigate, isSubmitted, t]);

  const commands = useMemo(() => [
    { id: 'save', label: t('reviewWorkspace.cmdSaveDraft'), shortcut: '⌘S', run: () => ws.saveDraftNow() },
    { id: 'nav', label: t('reviewWorkspace.cmdToggleChapters'), run: () => ws.updatePrefs({ leftPanelCollapsed: !navOpen, focusMode: false }) },
    { id: 'notes', label: t('reviewWorkspace.cmdToggleNotes'), run: () => ws.updatePrefs({ rightPanelCollapsed: !notesOpen, focusMode: false }) },
    { id: 'finish', label: t('reviewWorkspace.cmdFinish'), run: () => ws.updatePrefs({ bottomPanelCollapsed: false, focusMode: false }) },
    { id: 'palette', label: t('reviewWorkspace.cmdPalette'), shortcut: '⌘K', run: () => setPaletteOpen(true) },
    { id: 'submit', label: t('reviewWorkspace.cmdSubmit'), run: () => { void handleSubmit(); } },
    { id: 'ch-next', label: t('reviewWorkspace.cmdNextChapter'), run: () => goChapter(1) },
    { id: 'ch-prev', label: t('reviewWorkspace.cmdPrevChapter'), run: () => goChapter(-1) },
  ], [ws, navOpen, notesOpen, goChapter, handleSubmit, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        ws.saveDraftNow();
      }
      if (e.key === 'Escape' && sheetOpen) {
        closeSheets();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ws, sheetOpen, closeSheets]);

  const dismissGuide = () => {
    setShowGuide(false);
    try {
      localStorage.setItem('katha_rw_guide_seen', '1');
    } catch { /* ignore */ }
  };

  if (ws.manuscriptLoading) {
    return (
      <div className="rw-shell rw-shell--premium rw-shell--loading" data-katha-mode="creation">
        <p className="rw-loading-text" role="status" aria-live="polite">{t('reviewWorkspace.loading')}</p>
      </div>
    );
  }

  return (
    <div
      className={`rw-shell rw-shell--premium rw-shell--immersive rw-shell--stage review-workspace-page--wave28 wc-page-enter${teluguShell ? ' rw-shell--telugu' : ''}`}
      data-katha-mode="creation"
      data-rw-review-lang={reviewLang}
    >
      <a href="#rw-main-reading" className="rw-skip-link">Skip to manuscript</a>
      <ReviewWorkspaceChrome
        manuscriptLabel={assignment.manuscript_label}
        chapterLabel={ws.currentChapter?.label ?? 'Chapter'}
        chapterIndex={chapterIndex < 0 ? 0 : chapterIndex}
        chapterCount={chapters.length}
        observationCount={ws.draft.comments.length}
        summaryOpen={summaryOpen}
        navOpen={navOpen}
        notesOpen={notesOpen}
        onToggleNav={() => ws.updatePrefs({
          leftPanelCollapsed: navOpen,
          rightPanelCollapsed: true,
          bottomPanelCollapsed: true,
          focusMode: navOpen,
        })}
        onToggleNotes={() => ws.updatePrefs({
          rightPanelCollapsed: notesOpen,
          leftPanelCollapsed: true,
          bottomPanelCollapsed: true,
          focusMode: notesOpen,
        })}
        onToggleSummary={() => ws.updatePrefs({
          bottomPanelCollapsed: summaryOpen,
          leftPanelCollapsed: true,
          rightPanelCollapsed: true,
          focusMode: summaryOpen,
        })}
        onPrevChapter={() => goChapter(-1)}
        onNextChapter={() => goChapter(1)}
      />

      <div aria-live="assertive" aria-atomic="true" className="rw-announcer">
        {ws.error && <p className="rw-banner-error" role="alert">{ws.error}</p>}
      </div>
      {isSubmitted && (
        <p className="rw-banner-success" role="status">
          Review submitted — you can still read notes and manuscript.
        </p>
      )}

        <CenterReadingPanel
          id="rw-main-reading"
          chapter={ws.currentChapter}
          comments={ws.draft.comments}
          activeCommentId={ws.activeCommentId}
          showTrackChanges={ws.draft.prefs.showTrackChanges}
          trackChanges={ws.draft.trackChanges}
          onTextSelect={handleTextSelect}
          onCommentMarkerClick={(id) => {
            ws.setActiveCommentId(id);
            setScrollToCommentId(id);
            ws.updatePrefs({ rightPanelCollapsed: false, leftPanelCollapsed: true, bottomPanelCollapsed: true, focusMode: false });
          }}
          chapterNum={ws.draft.currentChapter}
          showGuide={showGuide}
          onDismissGuide={dismissGuide}
          scrollToCommentId={scrollToCommentId}
        />

      {sheetOpen && (
        <button type="button" className="rw-backdrop" aria-label={t('reviewWorkspace.closePanels')} onClick={closeSheets} />
      )}

      {navOpen && (
        <div className="rw-sheet rw-sheet--left">
          <LeftStoryNavPanel
            manuscript={ws.manuscript}
            draft={ws.draft}
            onChapterSelect={ws.setChapter}
            onSceneSelect={ws.setScene}
            onClose={closeSheets}
          />
        </div>
      )}

      {notesOpen && (
        <div className="rw-sheet rw-sheet--right">
          <RightIntelligencePanel
            assignmentId={assignmentId}
            reviewerSlot={reviewerSlot}
            comments={ws.filteredComments}
            checklist={ws.draft.checklist}
            metrics={ws.draft.metrics}
            storyIntel={ws.storyIntel}
            reviewerRqi={ws.reviewerProfile.rqi}
            potentialRqi={ws.reviewerProfile.potentialRqi}
            commentFilter={ws.commentFilter}
            searchQuery={ws.searchQuery}
            activeCommentId={ws.activeCommentId}
            onClose={closeSheets}
            onFilterChange={ws.setCommentFilter}
            onSearchChange={ws.setSearchQuery}
            onCommentSelect={(id) => {
              ws.setActiveCommentId(id);
              setScrollToCommentId(id);
            }}
            onToggleChecklist={ws.toggleChecklist}
            onToggleCommentStatus={ws.toggleCommentStatus}
          />
        </div>
      )}

      {summaryOpen && (
        <div className="rw-sheet rw-sheet--bottom">
          <BottomSummaryPanel
            summary={ws.draft.summary}
            metrics={ws.draft.metrics}
            saving={ws.saving}
            submitting={ws.submitting}
            submitError={ws.error}
            readOnly={isSubmitted}
            onClose={closeSheets}
            onSummaryChange={ws.updateSummary}
            onApplyTemplate={(t) => ws.updateSummary({
              overallReview: t.overall,
              strengths: t.strengths,
              weaknesses: t.weaknesses,
              recommendation: t.recommendation,
              decision: t.decision,
            })}
            onSaveDraft={ws.saveDraftNow}
            onSubmit={() => { void handleSubmit(); }}
          />
        </div>
      )}

      {!summaryOpen && !isSubmitted && (
        <button
          type="button"
          className="rw-finish-pill"
          onClick={() => ws.updatePrefs({ bottomPanelCollapsed: false, focusMode: false })}
        >
          <PenLine size={14} aria-hidden />
          {ws.draft.comments.length > 0
            ? `${t('reviewWorkspace.cmdFinish')} · ${ws.draft.comments.length}`
            : t('reviewWorkspace.finishSubmit')}
        </button>
      )}

      {ws.selection && ws.toolbarPos && (
        <FloatingReviewToolbar
          position={ws.toolbarPos}
          selectedText={ws.selection.selectedText}
          onAction={(opts) => openDrawerForAction(opts)}
          onClose={() => { ws.setSelection(null); ws.setToolbarPos(null); }}
        />
      )}

      <CommentFormDrawer
        open={drawerOpen}
        kind={pendingAction?.kind ?? 'comment'}
        category={pendingAction?.category ?? 'plot'}
        priority={pendingAction?.priority ?? 'medium'}
        selectedText={ws.selection?.selectedText}
        chapterNum={ws.draft.currentChapter}
        sceneLabel={ws.currentChapter?.scenes.find((s) => s.id === ws.selection?.sceneId)?.title}
        paragraphIndex={ws.selection?.paragraphIndex ?? 0}
        onClose={() => { setDrawerOpen(false); setPendingAction(null); }}
        onSave={(data) => {
          const saved = ws.addComment({
            kind: data.kind,
            category: data.category,
            priority: data.priority,
            reason: data.reason,
            recommendation: data.recommendation,
            expectedImpact: data.expectedImpact,
            reviewerConfidence: data.reviewerConfidence,
            evidence: data.evidence,
            sceneId: ws.selection?.sceneId,
            paragraphIndex: ws.selection?.paragraphIndex ?? 0,
            selectedText: ws.selection?.selectedText,
            anchor: ws.selection ?? undefined,
          });
          setScrollToCommentId(saved.id);
          if (data.kind === 'suggestion' && ws.selection?.selectedText) {
            ws.addTrackChange({
              chapterNum: ws.draft.currentChapter,
              paragraphIndex: ws.selection.paragraphIndex,
              kind: 'replacement',
              originalText: ws.selection.selectedText,
              suggestedText: data.recommendation || ws.selection.selectedText,
            });
          }
          ws.setSelection(null);
        }}
      />

      <ReviewCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
    </div>
  );
}