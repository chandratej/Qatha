import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Plus, User } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import type { StudioStringKey } from '../../lib/studioLocale';
import '../../styles/editor-prototype.css';

type ChatSpeaker = 'protagonist' | 'antagonist' | 'narrator';

interface ChatBubble {
  id: string;
  speaker: ChatSpeaker;
  speakerName: string;
  text: string;
  timestamp: string;
}

const SPEAKER_ROLE_KEYS: Record<ChatSpeaker, StudioStringKey> = {
  protagonist: 'epistolaryEditor.roleProtagonist',
  antagonist: 'epistolaryEditor.roleAntagonist',
  narrator: 'epistolaryEditor.roleNarrator',
};

const DEMO_BUBBLES: ChatBubble[] = [
  {
    id: 'bubble-1',
    speaker: 'protagonist',
    speakerName: 'Ananya',
    text: 'Are you still coming tonight?',
    timestamp: '9:41 PM',
  },
  {
    id: 'bubble-2',
    speaker: 'antagonist',
    speakerName: 'Rohan',
    text: 'Maybe. Depends on whether you actually mean it this time.',
    timestamp: '9:42 PM',
  },
  {
    id: 'bubble-3',
    speaker: 'narrator',
    speakerName: 'System',
    text: 'Ananya stared at the three dots pulsing on her screen.',
    timestamp: '9:43 PM',
  },
];

function createBubble(index: number): ChatBubble {
  return {
    id: `bubble-${Date.now()}-${index}`,
    speaker: 'protagonist',
    speakerName: 'Character',
    text: '',
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
  };
}

/**
 * Phase 1 epistolary editor — chat-bubble scaffold.
 * Route: /stories/:storyId/epistolary/:chapterNum
 */
export function EpistolaryEditor() {
  const { storyId, chapterNum } = useParams<{ storyId: string; chapterNum: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const chapter = Number(chapterNum) || 1;

  const [chapterTitle, setChapterTitle] = useState(`Chapter ${chapter}`);
  const [bubbles, setBubbles] = useState<ChatBubble[]>(DEMO_BUBBLES);

  const speakerRoles = useMemo(
    () => (Object.keys(SPEAKER_ROLE_KEYS) as ChatSpeaker[]),
    [],
  );

  const addBubble = useCallback(() => {
    setBubbles((prev) => [...prev, createBubble(prev.length)]);
  }, []);

  const updateBubble = useCallback((id: string, patch: Partial<ChatBubble>) => {
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  return (
    <div className="katha-proto-layout katha-proto-layout--premium epistolary-editor wc-page-enter" data-katha-mode="creation">
      <header className="katha-editor-chrome epistolary-editor__chrome">
        <div className="katha-editor-chrome__row katha-editor-chrome__row--primary">
          <div className="katha-editor-chrome__leading">
            <button
              type="button"
              className="katha-icon-btn"
              onClick={() => navigate(`/stories/${storyId}`)}
              aria-label={t('epistolaryEditor.back')}
            >
              <ArrowLeft size={18} aria-hidden />
            </button>
            <span className="epistolary-editor__badge">
              <MessageCircle size={14} aria-hidden />
              {t('epistolaryEditor.badge')}
            </span>
          </div>
          <div className="katha-editor-doc-actions">
            <button type="button" className="katha-btn katha-btn--ghost" onClick={addBubble}>
              <Plus size={16} aria-hidden />
              {t('epistolaryEditor.addMessage')}
            </button>
          </div>
        </div>
        <div className="katha-editor-chrome__row katha-editor-chrome__row--meta">
          <input
            className="katha-inline-title-input epistolary-editor__title"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            aria-label={t('epistolaryEditor.chapterTitle')}
          />
          <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
          <span className="input-hint">{t('epistolaryEditor.scaffoldHint')}</span>
        </div>
      </header>

      <main className="epistolary-editor__thread wc-stagger-children" aria-label="Chat thread">
        {bubbles.map((bubble) => (
          <article
            key={bubble.id}
            className={`epistolary-bubble epistolary-bubble--${bubble.speaker}`}
          >
            <header className="epistolary-bubble__head">
              <span className="epistolary-bubble__avatar" aria-hidden>
                <User size={14} />
              </span>
              <div className="epistolary-bubble__meta">
                <input
                  className="epistolary-bubble__name"
                  value={bubble.speakerName}
                  onChange={(e) => updateBubble(bubble.id, { speakerName: e.target.value })}
                  aria-label={t('epistolaryEditor.speakerName')}
                />
                <select
                  className="epistolary-bubble__role"
                  value={bubble.speaker}
                  onChange={(e) => updateBubble(bubble.id, { speaker: e.target.value as ChatSpeaker })}
                  aria-label={t('epistolaryEditor.speakerRole')}
                >
                  {speakerRoles.map((role) => (
                    <option key={role} value={role}>{t(SPEAKER_ROLE_KEYS[role])}</option>
                  ))}
                </select>
                <time className="epistolary-bubble__time">{bubble.timestamp}</time>
              </div>
            </header>
            <textarea
              className="epistolary-bubble__body"
              value={bubble.text}
              onChange={(e) => updateBubble(bubble.id, { text: e.target.value })}
              placeholder={t('epistolaryEditor.messagePlaceholder')}
              rows={2}
            />
          </article>
        ))}
      </main>
    </div>
  );
}