import { useState } from 'react';
import { BookOpen, ChevronDown, X } from 'lucide-react';
import type { BlindManuscript } from '../../../types/reviewWorkspace';
import type { ReviewWorkspaceDraft } from '../../../types/reviewWorkspace';

interface Props {
  manuscript: BlindManuscript;
  draft: ReviewWorkspaceDraft;
  onChapterSelect: (num: number) => void;
  onSceneSelect: (sceneId: string, chapterNum: number) => void;
  onClose: () => void;
}

export function LeftStoryNavPanel({
  manuscript,
  draft,
  onChapterSelect,
  onSceneSelect,
  onClose,
}: Props) {
  const [expandedChapter, setExpandedChapter] = useState(draft.currentChapter);
  const progressPct = manuscript.chapters.length
    ? Math.round((draft.chaptersReviewed.length / manuscript.chapters.length) * 100)
    : 0;

  return (
    <aside className="rw-sheet-panel" aria-label="Chapters and scenes">
      <div className="rw-sheet-panel__head">
        <BookOpen size={16} aria-hidden />
        <span>Scenes</span>
        <button type="button" className="rw-sheet-panel__close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <div className="rw-sheet-panel__progress">
        <div className="rw-progress__bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="rw-progress__fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="rw-progress__label">{progressPct}% read · {draft.comments.length} anchored notes</span>
      </div>

      <nav className="rw-scene-nav" aria-label="Chapter and scene navigation">
        {manuscript.chapters.map((ch) => {
          const isActiveChapter = draft.currentChapter === ch.num;
          const isExpanded = expandedChapter === ch.num;
          const chapterNotes = draft.comments.filter((c) => c.chapterNum === ch.num).length;

          return (
            <div key={ch.num} className={`rw-scene-nav__chapter${isActiveChapter ? ' rw-scene-nav__chapter--active' : ''}`}>
              <div className="rw-scene-nav__chapter-row">
                <button
                  type="button"
                  className="rw-scene-nav__chapter-btn"
                  onClick={() => {
                    setExpandedChapter(ch.num);
                    onChapterSelect(ch.num);
                  }}
                >
                  <span>{ch.label}</span>
                  <span className="rw-scene-nav__meta">
                    {ch.scenes.length} scenes
                    {chapterNotes > 0 && <span className="rw-chapter-nav__badge">{chapterNotes}</span>}
                  </span>
                </button>
                <button
                  type="button"
                  className="rw-scene-nav__expand"
                  onClick={() => setExpandedChapter(isExpanded ? -1 : ch.num)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} scenes in ${ch.label}`}
                >
                  <ChevronDown size={14} className={`rw-scene-nav__chevron${isExpanded ? ' rw-scene-nav__chevron--open' : ''}`} aria-hidden />
                </button>
              </div>

              {isExpanded && (
                <ul className="rw-scene-nav__scenes">
                  {ch.scenes.map((scene) => {
                    const paraIndexes = new Set(scene.paragraphs.map((p) => p.index));
                    const sceneNotes = draft.comments.filter(
                      (c) => c.chapterNum === ch.num && (c.sceneId === scene.id || (!c.sceneId && paraIndexes.has(c.paragraphIndex))),
                    ).length;
                    const isActiveScene = draft.currentSceneId === scene.id && isActiveChapter;
                    return (
                      <li key={scene.id}>
                        <button
                          type="button"
                          className={`rw-scene-nav__scene${isActiveScene ? ' rw-scene-nav__scene--active' : ''}`}
                          onClick={() => {
                            onSceneSelect(scene.id, ch.num);
                            onClose();
                          }}
                        >
                          <span className="rw-scene-nav__scene-title">{scene.title}</span>
                          <span className="rw-scene-nav__scene-meta">
                            {scene.estimatedMinutes}m
                            {sceneNotes > 0 && <span className="rw-chapter-nav__badge">{sceneNotes}</span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <p className="rw-sheet-panel__foot">Highlight text to anchor notes · like Word comments</p>
    </aside>
  );
}