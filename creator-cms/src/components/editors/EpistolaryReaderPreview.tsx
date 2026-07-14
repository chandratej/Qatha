import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { StudioIllustration } from '../studio/StudioIllustration';
import { StudioGlyph } from '../studio/StudioGlyph';
import type { StudioGlyphId } from '../studio/StudioGlyph';
import type { ChatSpeaker, EpistolaryBubble } from '../../lib/alternateEditorCache';

const SPEAKER_GLYPHS: Record<ChatSpeaker, StudioGlyphId> = {
  protagonist: 'users',
  antagonist: 'heart',
  narrator: 'sparkles',
};

const TYPING_MS = 650;

interface Props {
  chapterTitle: string;
  bubbles: EpistolaryBubble[];
  variant?: 'panel' | 'fullscreen';
}

export function EpistolaryReaderPreview({ chapterTitle, bubbles, variant = 'panel' }: Props) {
  const { t } = useLocale();
  const threadRef = useRef<HTMLDivElement>(null);
  const visible = bubbles.filter((b) => b.text.trim().length > 0);
  const [revealed, setRevealed] = useState(() => (visible.length > 0 ? 1 : 0));
  const [isTyping, setIsTyping] = useState(false);

  const bubbleKey = visible.map((b) => `${b.id}:${b.text}`).join('|');

  useEffect(() => {
    setRevealed(visible.length > 0 ? 1 : 0);
    setIsTyping(false);
  }, [bubbleKey, visible.length]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [revealed, isTyping]);

  const canAdvance = revealed < visible.length && !isTyping;

  const advance = useCallback(() => {
    if (!canAdvance) return;
    setIsTyping(true);
    window.setTimeout(() => {
      setRevealed((r) => r + 1);
      setIsTyping(false);
    }, TYPING_MS);
  }, [canAdvance]);

  const reset = useCallback(() => {
    setIsTyping(false);
    setRevealed(visible.length > 0 ? 1 : 0);
  }, [visible.length]);

  const shown = visible.slice(0, revealed);

  const rootClass = [
    'alternate-reader-preview',
    'epistolary-reader-preview',
    'epistolary-reader-preview--interactive',
    variant === 'fullscreen' ? 'epistolary-reader-preview--fullscreen' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={rootClass} aria-label={t('epistolaryEditor.previewLabel')}>
      {variant === 'panel' && (
      <header className="alternate-reader-preview__head">
        <StudioIllustration id="chat-thread" tone="maroon" size={48} />
        <div>
          <span className="katha-token-eyebrow">{t('epistolaryEditor.previewLabel')}</span>
          <h2 className="alternate-reader-preview__title">{chapterTitle}</h2>
        </div>
        <button type="button" className="alternate-reader-preview__reset" onClick={reset} aria-label={t('epistolaryEditor.previewReset')}>
          <RotateCcw size={14} aria-hidden />
        </button>
      </header>
      )}

      <div
        className="epistolary-reader-preview__device"
        role="button"
        tabIndex={0}
        onClick={advance}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            advance();
          }
        }}
        aria-label={canAdvance ? t('epistolaryEditor.previewTap') : undefined}
      >
        <div className="epistolary-reader-preview__statusbar" aria-hidden>
          <span>9:41</span>
          <span className="epistolary-reader-preview__signal">●●●</span>
        </div>

        {visible.length === 0 ? (
          <p className="alternate-reader-preview__empty">{t('epistolaryEditor.previewEmpty')}</p>
        ) : (
          <div ref={threadRef} className="epistolary-reader-preview__thread">
            {shown.map((bubble) => (
              <div
                key={bubble.id}
                className={`epistolary-reader-bubble epistolary-reader-bubble--${bubble.speaker} epistolary-reader-bubble--enter`}
              >
                {bubble.speaker !== 'narrator' && (
                  <span className="epistolary-reader-bubble__avatar" aria-hidden>
                    <StudioGlyph id={SPEAKER_GLYPHS[bubble.speaker]} variant="soft" size={14} />
                  </span>
                )}
                <div className="epistolary-reader-bubble__content">
                  {bubble.speaker !== 'narrator' && (
                    <span className="epistolary-reader-bubble__name">{bubble.speakerName}</span>
                  )}
                  <p className="epistolary-reader-bubble__text">{bubble.text}</p>
                  {bubble.speaker !== 'narrator' && (
                    <time className="epistolary-reader-bubble__time">{bubble.timestamp}</time>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="epistolary-reader-typing" aria-live="polite">
                <span className="epistolary-reader-typing__dots" aria-hidden>
                  <span /><span /><span />
                </span>
                <span className="epistolary-reader-typing__label">{t('epistolaryEditor.previewTyping')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="alternate-reader-preview__controls">
        <button type="button" className="katha-btn katha-btn--ghost katha-btn--sm" onClick={advance} disabled={!canAdvance}>
          {t('epistolaryEditor.previewNext')}
        </button>
        <span className="alternate-reader-preview__progress">
          {revealed}/{visible.length}
        </span>
      </div>

      {variant === 'panel' && (
        <p className="alternate-reader-preview__footnote input-hint">{t('epistolaryEditor.previewFootnote')}</p>
      )}
    </aside>
  );
}