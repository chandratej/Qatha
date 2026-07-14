import { useCallback, useEffect, useRef } from 'react';
import type { BlindManuscriptChapter, ReviewComment } from '../../../types/reviewWorkspace';
import type { ReviewLanguage } from '../../../lib/reviewLanguagePrefs';
import { categoryLabel } from '../../../lib/reviewCategories';
import { useReviewLanguage } from './ReviewLanguageBar';
import { getRangeOffsets, renderHighlightedParagraphHtml, scrollToCommentAnchor } from '../../../lib/reviewAnchors';
import { ReviewComfortBar } from './ReviewComfortBar';
import { ReviewLanguageBar } from './ReviewLanguageBar';
import { sanitizeHtml } from '../../../lib/sanitizeHtml';

interface Props {
  id?: string;
  chapter: BlindManuscriptChapter | undefined;
  comments: ReviewComment[];
  activeCommentId: string | null;
  showTrackChanges: boolean;
  trackChanges: Array<{ id: string; paragraphIndex: number; kind: string; originalText: string; suggestedText: string }>;
  onTextSelect: (anchor: {
    chapterNum: number;
    sceneId: string;
    paragraphIndex: number;
    startOffset: number;
    endOffset: number;
    selectedText: string;
  }, rect: DOMRect) => void;
  onCommentMarkerClick: (commentId: string) => void;
  chapterNum: number;
  showGuide: boolean;
  onDismissGuide: () => void;
  scrollToCommentId?: string | null;
}

export function CenterReadingPanel({
  id,
  chapter,
  comments,
  activeCommentId,
  showTrackChanges,
  trackChanges,
  onTextSelect,
  onCommentMarkerClick,
  chapterNum,
  showGuide,
  onDismissGuide,
  scrollToCommentId,
}: Props) {
  const { language } = useReviewLanguage();
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollToCommentId) {
      const t = window.setTimeout(() => scrollToCommentAnchor(scrollToCommentId), 80);
      return () => window.clearTimeout(t);
    }
  }, [scrollToCommentId]);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const textEl = range.startContainer.parentElement?.closest('[data-paragraph-text]') as HTMLElement | null;
    const rowEl = range.startContainer.parentElement?.closest('[data-paragraph-index]');
    if (!textEl || !rowEl || !surfaceRef.current?.contains(rowEl)) return;

    const selectedText = range.toString();
    if (selectedText.trim().length < 2) return;

    const offsets = getRangeOffsets(textEl, range);
    if (!offsets) return;

    const paragraphIndex = Number(rowEl.getAttribute('data-paragraph-index') ?? 0);
    const sceneId = rowEl.getAttribute('data-scene-id') ?? 'scene-unknown';
    const rect = range.getBoundingClientRect();

    onTextSelect({
      chapterNum,
      sceneId,
      paragraphIndex,
      startOffset: offsets.start,
      endOffset: offsets.end,
      selectedText,
    }, rect);
  }, [chapterNum, onTextSelect]);

  const handleTextClick = useCallback((e: React.MouseEvent) => {
    const mark = (e.target as HTMLElement).closest('[data-comment-id]');
    if (mark) {
      e.preventDefault();
      onCommentMarkerClick(mark.getAttribute('data-comment-id')!);
    }
  }, [onCommentMarkerClick]);

  return (
    <main id={id} className="rw-stage" tabIndex={-1}>
      <div className="rw-stage__comfort rw-stage__comfort--full">
        <ReviewLanguageBar />
        <ReviewComfortBar />
      </div>

      <div className="rw-reading-surface rw-reading-surface--annotated" ref={surfaceRef} onMouseUp={handleMouseUp}>
        <div className="rw-manuscript-canvas rw-manuscript-canvas--annotated">
          {showGuide && (
            <div className="rw-reading-guide">
              <p className="rw-reading-guide__title">Tag issues exactly where they live</p>
              <p className="rw-reading-guide__text">
                Review scene by scene. Highlight any phrase — like Microsoft Word comments —
                and your note anchors to that exact passage in the margin.
              </p>
              <button type="button" className="rw-reading-guide__cta" onClick={onDismissGuide}>
                Begin reading
              </button>
            </div>
          )}

          <header className="rw-manuscript__header">
            <h2>{chapter?.label ?? 'Chapter'}</h2>
            <p className="rw-manuscript__meta">
              {chapter?.scenes.length ?? 0} scenes · {chapter?.wordCount.toLocaleString()} words
            </p>
          </header>

          {renderScenes(chapter, comments, chapterNum, trackChanges, showTrackChanges, activeCommentId, language, handleTextClick, onCommentMarkerClick)}
        </div>
      </div>
    </main>
  );
}

function renderScenes(
  chapter: BlindManuscriptChapter | undefined,
  comments: ReviewComment[],
  chapterNum: number,
  trackChanges: Array<{ id: string; paragraphIndex: number; kind: string; originalText: string; suggestedText: string }>,
  showTrackChanges: boolean,
  activeCommentId: string | null,
  language: ReviewLanguage,
  onTextClick: (e: React.MouseEvent) => void,
  onCommentMarkerClick: (id: string) => void,
) {
  if (!chapter?.scenes.length) {
    return <p className="rw-manuscript__empty">Manuscript content will appear here once available.</p>;
  }

  return (
    <div className="rw-scenes">
      {chapter.scenes.map((scene) => {
        const paraIndexes = new Set(scene.paragraphs.map((p) => p.index));
        const sceneComments = comments.filter(
          (c) => c.chapterNum === chapterNum && (c.sceneId === scene.id || (!c.sceneId && paraIndexes.has(c.paragraphIndex))),
        );
        return (
          <section
            key={scene.id}
            id={`scene-${scene.id}`}
            className="rw-scene"
            data-scene-id={scene.id}
            aria-label={scene.title}
          >
            <header className="rw-scene__header">
              <h3 className="rw-scene__title">{scene.title}</h3>
              <span className="rw-scene__meta">
                {scene.wordCount.toLocaleString()}w · ~{scene.estimatedMinutes}m
                {sceneComments.length > 0 && (
                  <span className="rw-scene__note-count">{sceneComments.length} note{sceneComments.length === 1 ? '' : 's'}</span>
                )}
              </span>
            </header>

            <div className="rw-scene__body">
              {scene.paragraphs.map((para) => {
                const paraComments = comments.filter(
                  (c) => c.chapterNum === chapterNum && c.paragraphIndex === para.index,
                );
                const paraChanges = trackChanges.filter((t) => t.paragraphIndex === para.index);
                const highlightedHtml = renderHighlightedParagraphHtml(
                  para.plainText,
                  paraComments,
                  activeCommentId,
                );

                return (
                  <div
                    key={para.id}
                    className={`rw-annotated-row${activeCommentId && paraComments.some((c) => c.id === activeCommentId) ? ' rw-annotated-row--active' : ''}`}
                    data-paragraph-index={para.index}
                    data-scene-id={scene.id}
                  >
                    <div className="rw-annotated-row__text">
                      <div
                        className="rw-paragraph__text"
                        data-paragraph-text
                        onClick={onTextClick}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            const id = (e.target as HTMLElement).getAttribute('data-comment-id');
                            if (id) onCommentMarkerClick(id);
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightedHtml) }}
                      />
                      {showTrackChanges && paraChanges.map((tc) => (
                        <div key={tc.id} className="rw-track-change">
                          {tc.kind === 'deletion' && <del>{tc.originalText}</del>}
                          {tc.kind === 'insertion' && <ins>{tc.suggestedText}</ins>}
                          {tc.kind === 'replacement' && (
                            <><del>{tc.originalText}</del> <ins>{tc.suggestedText}</ins></>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="rw-annotated-row__margin" role="group" aria-label="Margin notes">
                      {paraComments.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`rw-margin-note rw-margin-note--${c.priority}${c.id === activeCommentId ? ' rw-margin-note--active' : ''}${c.kind === 'suggestion' ? ' rw-margin-note--suggest' : ''}`}
                          onClick={() => onCommentMarkerClick(c.id)}
                          title={c.reason}
                        >
                          <span className="rw-margin-note__cat">{categoryLabel(c.category, language)}</span>
                          <span className="rw-margin-note__text">{c.reason}</span>
                          {c.selectedText && (
                            <span className="rw-margin-note__quote">“{c.selectedText.slice(0, 40)}{c.selectedText.length > 40 ? '…' : ''}”</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}