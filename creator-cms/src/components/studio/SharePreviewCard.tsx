import { MessageCircle, Share2 } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { buildShareMessage, shareViaWhatsApp, shareViaX } from '../../lib/socialShare';

export interface SharePreviewProps {
  url: string;
  storyTitle: string;
  chapterTitle?: string;
  chapterNumber?: number;
  authorName?: string;
  coverUrl?: string | null;
  excerpt?: string;
}

export function SharePreviewCard({
  url,
  storyTitle,
  chapterTitle,
  chapterNumber,
  authorName = 'Katha Creator',
  coverUrl,
  excerpt,
}: SharePreviewProps) {
  const displayTitle = chapterTitle?.trim() || storyTitle;
  const pullQuote = excerpt?.trim() || 'తెలుగు కథలు. Read the next chapter on Katha.';
  const shareMessage = buildShareMessage(storyTitle, chapterTitle, chapterNumber);

  return (
    <div className="share-preview" aria-label="Link preview — how readers see your chapter on social">
      <p className="share-preview__eyebrow">
        <Share2 size={14} aria-hidden />
        Preview on WhatsApp &amp; social
      </p>
      <div className="share-preview__card">
        {coverUrl ? (
          <div className="share-preview__cover">
            <img src={coverUrl} alt="" />
          </div>
        ) : (
          <div className="share-preview__cover share-preview__cover--seal" aria-hidden>
            <BrandMark size="md" />
          </div>
        )}
        <div className="share-preview__body">
          <div className="share-preview__brand">
            <BrandMark size="xs" />
            <span className="share-preview__brand-name">Katha</span>
            {chapterNumber != null && (
              <span className="share-preview__chapter">· Chapter {chapterNumber}</span>
            )}
          </div>
          <p className="share-preview__author">{authorName}</p>
          <h3 className="share-preview__title">{displayTitle}</h3>
          {chapterTitle && storyTitle !== chapterTitle && (
            <p className="share-preview__story">{storyTitle}</p>
          )}
          <blockquote className="share-preview__quote" lang="te">{pullQuote}</blockquote>
          <span className="share-preview__cta">Continue reading →</span>
        </div>
      </div>
      <div className="share-preview__actions">
        <button
          type="button"
          className="share-preview__social share-preview__social--wa"
          onClick={() => shareViaWhatsApp(url, shareMessage)}
        >
          <MessageCircle size={16} aria-hidden />
          Share on WhatsApp
        </button>
        <button
          type="button"
          className="share-preview__social share-preview__social--x"
          onClick={() => shareViaX(url, shareMessage)}
        >
          Share on X
        </button>
      </div>
    </div>
  );
}