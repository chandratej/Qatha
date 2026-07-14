import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, MessageCircle, X } from 'lucide-react';
import type { StoryData } from '../../types/database';
import type { ChapterListItem } from '../../types/database';
import { useLocale } from '../../context/LocaleContext';
import { buildChapterShareUrl, resolveStorySlug } from '../../lib/shareLinks';
import { buildShareMessage, shareViaWhatsApp, shareViaX } from '../../lib/socialShare';
import { trackCreatorEvent } from '../../lib/analyticsEvents';
import { SharePreviewCard } from './SharePreviewCard';

const FREE_PREVIEW_CHAPTERS = 10;

export interface ShareModalProps {
  story: StoryData;
  chapters: ChapterListItem[];
  onClose: () => void;
  authorName?: string;
}

export function ShareModal({ story, chapters, onClose, authorName }: ShareModalProps) {
  const { t } = useLocale();
  const storySlug = resolveStorySlug(story);

  const chapterOptions = useMemo(() => {
    const list = chapters.length > 0
      ? [...chapters].sort((a, b) => a.chapter_number - b.chapter_number)
      : [{ chapter_number: 1, title: undefined }];
    return list;
  }, [chapters]);

  const [chapterNumber, setChapterNumber] = useState(chapterOptions[0]?.chapter_number ?? 1);
  const [copied, setCopied] = useState(false);

  const selectedChapter = chapterOptions.find((c) => c.chapter_number === chapterNumber)
    ?? chapterOptions[0];

  const shareUrl = buildChapterShareUrl(storySlug, chapterNumber);
  const shareMessage = buildShareMessage(story.title, selectedChapter?.title, chapterNumber);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    trackCreatorEvent('chapter_shared', {
      channel: 'copy',
      storyId: story.id,
      chapterNumber,
    });
    trackCreatorEvent('share_channel', { channel: 'copy', storyId: story.id });
    window.setTimeout(() => setCopied(false), 2000);
  }, [shareUrl, story.id, chapterNumber]);

  const trackShare = (channel: 'whatsapp' | 'x') => {
    trackCreatorEvent('chapter_shared', {
      channel,
      storyId: story.id,
      chapterNumber,
      storyTitle: story.title,
    });
    trackCreatorEvent('share_channel', { channel, storyId: story.id });
  };

  return (
    <div className="share-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="share-modal share-modal--wave28"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="share-modal__head">
          <h2 id="share-modal-title" className="share-modal__title">{t('shareModal.title')}</h2>
          <button
            type="button"
            className="share-modal__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={20} aria-hidden />
          </button>
        </header>

        <div className="share-modal__body">
          <div className="share-modal__preview">
            <SharePreviewCard
              url={shareUrl}
              storyTitle={story.title}
              chapterTitle={selectedChapter?.title}
              chapterNumber={chapterNumber}
              authorName={authorName}
              coverUrl={story.cover_url}
              excerpt={story.description ?? undefined}
              storyId={story.id}
            />
          </div>

          <label className="share-modal__field">
            <span className="share-modal__label">{t('shareModal.selectChapter')}</span>
            <select
              className="cms-select share-modal__select"
              value={chapterNumber}
              onChange={(e) => setChapterNumber(Number(e.target.value))}
            >
              {chapterOptions.map((ch) => (
                <option key={ch.chapter_number} value={ch.chapter_number}>
                  {ch.title?.trim()
                    ? `Chapter ${ch.chapter_number} — ${ch.title}`
                    : `Chapter ${ch.chapter_number}`}
                </option>
              ))}
            </select>
          </label>

          <p className="share-modal__hint">
            {t('shareModal.freeHint').replace('10', String(FREE_PREVIEW_CHAPTERS))}
          </p>

          <label className="share-modal__field">
            <span className="share-modal__label">{t('shareModal.linkLabel')}</span>
            <div className="share-modal__link-row">
              <input
                type="text"
                className="cms-input share-modal__link-input"
                value={shareUrl}
                readOnly
                aria-label={t('shareModal.linkLabel')}
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                className="btn btn-secondary share-modal__copy"
                onClick={() => { void handleCopy(); }}
                aria-label={copied ? t('common.copied') : t('shareModal.copyLink')}
              >
                {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                {copied ? t('common.copied') : t('shareModal.copyLink')}
              </button>
            </div>
          </label>

          <div className="share-modal__social">
            <button
              type="button"
              className="share-modal__social-btn share-modal__social-btn--wa"
              onClick={() => {
                trackShare('whatsapp');
                shareViaWhatsApp(shareUrl, shareMessage);
              }}
            >
              <MessageCircle size={18} aria-hidden />
              WhatsApp
            </button>
            <button
              type="button"
              className="share-modal__social-btn share-modal__social-btn--x"
              onClick={() => {
                trackShare('x');
                shareViaX(shareUrl, shareMessage);
              }}
            >
              <span aria-hidden>X</span>
              X
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}