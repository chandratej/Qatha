import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import '../../styles/editor-prototype.css';

const WORD_GOAL = 2000;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * English prose editor shell — separate from Telugu ChapterEditor.
 * Route: /stories/:storyId/en/chapters/:chapterNum
 */
export function EnglishEditor() {
  const { storyId, chapterNum } = useParams<{ storyId: string; chapterNum: string }>();
  const navigate = useNavigate();
  const chapter = Number(chapterNum) || 1;

  const [chapterTitle, setChapterTitle] = useState(`Chapter ${chapter}`);
  const [prose, setProse] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const wordCount = useMemo(() => countWords(prose), [prose]);
  const readMins = Math.max(1, Math.round(wordCount / 200));

  const handleSaveDraft = useCallback(() => {
    setSaving(true);
    window.setTimeout(() => {
      setLastSaved(new Date());
      setSaving(false);
    }, 400);
  }, []);

  return (
    <div className="katha-proto-layout english-editor" data-katha-mode="creation" lang="en" dir="ltr">
      <header className="katha-editor-chrome english-editor__chrome">
        <div className="katha-editor-chrome__row katha-editor-chrome__row--primary">
          <div className="katha-editor-chrome__leading">
            <button
              type="button"
              className="katha-icon-btn"
              onClick={() => navigate(`/stories/${storyId}`)}
              aria-label="Back to manuscript"
            >
              <ArrowLeft size={18} aria-hidden />
            </button>
            <span className="english-editor__badge">
              <BookOpen size={14} aria-hidden />
              English Prose
            </span>
          </div>
          <div className="katha-editor-doc-actions">
            <button
              type="button"
              className="katha-btn katha-btn--ghost"
              disabled={saving}
              onClick={handleSaveDraft}
            >
              <Save size={16} aria-hidden />
              {saving ? 'Saving…' : 'Save draft'}
            </button>
          </div>
        </div>
        <div className="katha-editor-chrome__row katha-editor-chrome__row--meta">
          <input
            className="katha-inline-title-input english-editor__title"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            aria-label="Chapter title"
          />
          <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
          <span className="katha-editor-doc-stats">
            {wordCount.toLocaleString()} words · ~{readMins} min read
          </span>
          {lastSaved && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
              <span className="katha-editor-save-status katha-editor-save-status--saved">
                Saved {lastSaved.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </>
          )}
        </div>
      </header>

      <main className="english-editor__workspace">
        <div className="english-editor__canvas">
          <p className="english-editor__hint input-hint">
            English prose shell — scene sidebar and Telugu craft tools are intentionally omitted.
            Goal: {WORD_GOAL.toLocaleString()} words per chapter.
          </p>
          <textarea
            className="english-editor__prose"
            value={prose}
            onChange={(e) => setProse(e.target.value)}
            placeholder="Begin your chapter in English…"
            spellCheck
            aria-label="Chapter prose"
          />
        </div>
      </main>
    </div>
  );
}