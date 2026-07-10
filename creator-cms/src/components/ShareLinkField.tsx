import { useCallback, useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { openShareLinkAsAuthor } from '../lib/openShareLink';
import { SharePreviewCard, type SharePreviewProps } from './studio/SharePreviewCard';

interface Props {
  url: string;
  label?: string;
  compact?: boolean;
  preview?: Omit<SharePreviewProps, 'url'>;
}

export function ShareLinkField({ url, label = 'Share link', compact = false, preview }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  if (compact) {
    return (
      <button
        type="button"
        className="share-link-btn"
        onClick={handleCopy}
        title={copied ? 'Copied!' : `Copy share link: ${url}`}
        aria-label={copied ? 'Link copied' : 'Copy share link'}
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        <span>{copied ? 'Copied' : 'Copy link'}</span>
      </button>
    );
  }

  return (
    <div className="share-link-field">
      {preview && (
        <SharePreviewCard
          url={url}
          storyTitle={preview.storyTitle}
          chapterTitle={preview.chapterTitle}
          chapterNumber={preview.chapterNumber}
          authorName={preview.authorName}
          coverUrl={preview.coverUrl}
          excerpt={preview.excerpt}
        />
      )}
      <span className="share-link-field__label">{label}</span>
      <div className="share-link-field__row">
        <input
          type="text"
          className="cms-input share-link-field__input"
          value={url}
          readOnly
          aria-label={label}
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          className="btn btn-secondary share-link-field__copy"
          onClick={handleCopy}
          aria-label={copied ? 'Link copied' : 'Copy link'}
        >
          {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          className="btn btn-ghost share-link-field__open"
          aria-label="Preview share link as author"
          onClick={() => { void openShareLinkAsAuthor(url); }}
        >
          <ExternalLink size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}