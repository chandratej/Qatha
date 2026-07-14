import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Copy, Loader2, Share2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { StudioArtFrame } from '../../components/studio/StudioArtFrame';
import { EpistolaryReaderPreview } from '../../components/editors/EpistolaryReaderPreview';
import { BranchingReaderPreview } from '../../components/editors/BranchingReaderPreview';
import type { EpistolaryBubble, BranchNode } from '../../lib/alternateEditorCache';
import { loadEpistolaryMerged, loadBranchingMerged } from '../../lib/alternateEditorSync';
import { normalizeBranchNodes } from '../../lib/branchingGraph';
import { trackCreatorEvent } from '../../lib/analyticsEvents';

const DEFAULT_BUBBLES: EpistolaryBubble[] = [];
const DEFAULT_NODES: BranchNode[] = [];

type ReaderFormat = 'epistolary' | 'branching';

export function AlternateReaderShell() {
  const { storyId = '', format = 'epistolary', chapterNum } = useParams<{
    storyId: string;
    format: string;
    chapterNum: string;
  }>();
  const { t } = useLocale();
  const chapter = Number(chapterNum) || 1;
  const readerFormat = (format === 'branching' ? 'branching' : 'epistolary') as ReaderFormat;

  const [title, setTitle] = useState(`Chapter ${chapter}`);
  const [bubbles, setBubbles] = useState<EpistolaryBubble[]>(DEFAULT_BUBBLES);
  const [nodes, setNodes] = useState<BranchNode[]>(DEFAULT_NODES);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const editorHref = readerFormat === 'branching'
    ? `/stories/${storyId}/branching/${chapter}`
    : `/stories/${storyId}/epistolary/${chapter}`;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/stories/${storyId}/read/${readerFormat}/${chapter}`
    : '';

  useEffect(() => {
    trackCreatorEvent('reader_shell_view', {
      story_id: storyId,
      chapter,
      format: readerFormat,
    });
  }, [storyId, chapter, readerFormat]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = readerFormat === 'branching'
      ? loadBranchingMerged(storyId, chapter, `Chapter ${chapter}`, DEFAULT_NODES)
      : loadEpistolaryMerged(storyId, chapter, `Chapter ${chapter}`, DEFAULT_BUBBLES);

    load
      .then((merged) => {
        if (cancelled) return;
        setTitle(merged.title);
        if (readerFormat === 'branching') {
          setNodes(normalizeBranchNodes(merged.data as BranchNode[]));
        } else {
          setBubbles(merged.data as EpistolaryBubble[]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [storyId, chapter, readerFormat]);

  const copyShareLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackCreatorEvent('reader_shell_share_copy', { story_id: storyId, chapter, format: readerFormat });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [shareUrl, storyId, chapter, readerFormat]);

  const illustration = readerFormat === 'branching' ? 'story-fork' : 'chat-thread';
  const formatLabel = readerFormat === 'branching'
    ? t('readerShell.branchingLabel')
    : t('readerShell.epistolaryLabel');

  if (loading) {
    return (
      <div className="reader-shell reader-shell--loading wc-page-enter">
        <Loader2 size={24} className="cms-loading__spin" aria-hidden />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="reader-shell reader-shell--premium reader-shell--published reader-shell--wave26 reader-shell--wave28 reader-shell--immersive wc-page-enter" data-reader-format={readerFormat}>
      <header className="reader-shell__chrome reader-shell__chrome--published">
        <Link to={editorHref} className="reader-shell__back katha-icon-btn" aria-label={t('readerShell.backToEditor')}>
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <div className="reader-shell__meta">
          <span className="reader-shell__badge">
            <BookOpen size={14} aria-hidden />
            {formatLabel}
          </span>
          <h1 className="reader-shell__title">{title}</h1>
          <p className="reader-shell__subtitle">{t('readerShell.previewBadge')}</p>
        </div>
        <div className="reader-shell__actions">
          <button type="button" className="katha-btn katha-btn--ghost katha-btn--sm" onClick={() => { void copyShareLink(); }}>
            {copied ? <Copy size={14} aria-hidden /> : <Share2 size={14} aria-hidden />}
            {copied ? t('readerShell.linkCopied') : t('readerShell.copyLink')}
          </button>
        </div>
      </header>

      <div className="reader-shell__device-chrome" aria-hidden>
        <span className="reader-shell__device-notch" />
      </div>

      <p className="reader-shell__chapter-pill">
        {t('readerShell.chapterLabel')} {chapter}
      </p>

      <div className="reader-shell__progress" role="progressbar" aria-valuenow={35} aria-valuemin={0} aria-valuemax={100} aria-label={t('readerShell.readingProgress')}>
        <span className="reader-shell__progress-fill" />
      </div>

      <StudioArtFrame illustration={illustration} tone="gold" variant="reader" className="reader-shell__frame">
        {readerFormat === 'branching' ? (
          <BranchingReaderPreview chapterTitle={title} nodes={nodes} variant="fullscreen" />
        ) : (
          <EpistolaryReaderPreview chapterTitle={title} bubbles={bubbles} variant="fullscreen" />
        )}
      </StudioArtFrame>

      <p className="reader-shell__footnote input-hint">{t('readerShell.footnote')}</p>
    </div>
  );
}