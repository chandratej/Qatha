import { useState } from 'react';
import type { CommentKind, CommentPriority, ReviewCategoryId } from '../../../types/reviewWorkspace';
import { categoryLabel } from '../../../lib/reviewCategories';
import { REVIEW_CATEGORIES } from '../../../types/reviewWorkspace';
import { bilingualLabel, reviewUiStrings } from '../../../lib/reviewLocale';
import { useReviewLanguage } from './ReviewLanguageBar';
import { ReviewTeluguTextarea } from './ReviewTeluguTextarea';

interface Props {
  open: boolean;
  kind: CommentKind;
  category: ReviewCategoryId;
  priority: CommentPriority;
  selectedText?: string;
  chapterNum: number;
  sceneLabel?: string;
  paragraphIndex: number;
  onClose: () => void;
  onSave: (data: {
    reason: string;
    recommendation: string;
    expectedImpact: string;
    reviewerConfidence: number;
    evidence: string;
    category: ReviewCategoryId;
    priority: CommentPriority;
    kind: CommentKind;
  }) => void;
}

export function CommentFormDrawer({
  open,
  kind,
  category: initialCategory,
  priority: initialPriority,
  selectedText,
  chapterNum,
  sceneLabel,
  paragraphIndex,
  onClose,
  onSave,
}: Props) {
  const { language, phoneticTelugu } = useReviewLanguage();
  const ui = reviewUiStrings(language);
  const teluguInput = language !== 'english';

  const [category, setCategory] = useState(initialCategory);
  const [priority, setPriority] = useState(initialPriority);
  const [reason, setReason] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [expectedImpact, setExpectedImpact] = useState('');
  const [reviewerConfidence, setReviewerConfidence] = useState(80);

  if (!open) return null;

  const handleSave = () => {
    onSave({
      reason: reason.trim(),
      recommendation: recommendation.trim(),
      expectedImpact: expectedImpact.trim(),
      reviewerConfidence,
      evidence: selectedText?.trim() ?? '',
      category,
      priority,
      kind,
    });
    onClose();
  };

  return (
    <div className="rw-note-overlay" role="presentation" onClick={onClose}>
      <div
        className="rw-note-sheet rw-note-sheet--telugu"
        role="dialog"
        aria-labelledby="rw-note-title"
        onClick={(e) => e.stopPropagation()}
        lang={teluguInput ? 'te' : 'en'}
      >
        <header className="rw-note-sheet__head">
          <div>
            <h3 id="rw-note-title">{ui.captureNote}</h3>
            <p className="rw-note-sheet__loc">
              {bilingualLabel('అధ్యాయం', 'Ch.', language)} {chapterNum}
              {sceneLabel ? ` · ${sceneLabel}` : ''}
              {' · '}{bilingualLabel('పేరా', '¶', language)} {paragraphIndex + 1}
            </p>
          </div>
          <button type="button" className="rw-note-sheet__close" onClick={onClose} aria-label={ui.cancel}>×</button>
        </header>

        {selectedText && (
          <blockquote className="rw-note-sheet__quote" lang="te">
            “{selectedText.slice(0, 120)}{selectedText.length > 120 ? '…' : ''}”
          </blockquote>
        )}

        <div className="rw-note-sheet__body">
          <div className="rw-note-sheet__chips">
            <select
              className="rw-comfort__select"
              value={category}
              onChange={(e) => setCategory(e.target.value as ReviewCategoryId)}
              aria-label="Category"
            >
              {REVIEW_CATEGORIES.map((c) => (
                <option key={c} value={c}>{categoryLabel(c, language)}</option>
              ))}
            </select>
            <select
              className="rw-comfort__select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as CommentPriority)}
              aria-label="Priority"
            >
              <option value="low">{bilingualLabel('తక్కువ', 'Low', language)}</option>
              <option value="medium">{bilingualLabel('మధ్యస్థ', 'Medium', language)}</option>
              <option value="high">{bilingualLabel('అధిక', 'High', language)}</option>
              <option value="critical">{bilingualLabel('కీలకం', 'Critical', language)}</option>
            </select>
          </div>

          <label className="rw-note-sheet__field">
            <span>{ui.whatNoticed}</span>
            {teluguInput ? (
              <ReviewTeluguTextarea
                rows={3}
                value={reason}
                onChange={setReason}
                phoneticLive={phoneticTelugu}
                placeholder={ui.whatNoticedPlaceholder}
                autoFocus
              />
            ) : (
              <textarea
                className="rw-textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={ui.whatNoticedPlaceholder}
                autoFocus
              />
            )}
          </label>

          <label className="rw-note-sheet__field">
            <span>{ui.suggestion}</span>
            {teluguInput ? (
              <ReviewTeluguTextarea
                rows={2}
                value={recommendation}
                onChange={setRecommendation}
                phoneticLive={phoneticTelugu}
                placeholder={ui.suggestionPlaceholder}
              />
            ) : (
              <textarea
                className="rw-textarea"
                rows={2}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                placeholder={ui.suggestionPlaceholder}
              />
            )}
          </label>

          <button
            type="button"
            className="rw-note-sheet__details-toggle"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
          >
            {showDetails
              ? bilingualLabel('వివరాలు దాచు', 'Hide details', language)
              : bilingualLabel('అదనపు వివరాలు', 'Add reviewer details', language)}
          </button>

          {showDetails && (
            <div className="rw-note-sheet__details">
              <label className="rw-note-sheet__field">
                <span>{ui.expectedImpact}</span>
                {teluguInput ? (
                  <ReviewTeluguTextarea
                    rows={2}
                    value={expectedImpact}
                    onChange={setExpectedImpact}
                    phoneticLive={phoneticTelugu}
                    placeholder={ui.expectedImpactPlaceholder}
                  />
                ) : (
                  <input
                    className="cms-input rw-input--telugu"
                    value={expectedImpact}
                    onChange={(e) => setExpectedImpact(e.target.value)}
                    placeholder={ui.expectedImpactPlaceholder}
                    lang="te"
                    dir="auto"
                  />
                )}
              </label>
              <label className="rw-note-sheet__field">
                <span>{bilingualLabel('విశ్వాసం', 'Confidence', language)} ({reviewerConfidence}%)</span>
                <input
                  type="range"
                  min={40}
                  max={100}
                  value={reviewerConfidence}
                  onChange={(e) => setReviewerConfidence(Number(e.target.value))}
                />
              </label>
            </div>
          )}
        </div>

        <footer className="rw-note-sheet__foot">
          <button type="button" className="katha-cta katha-cta--soft" onClick={onClose}>{ui.cancel}</button>
          <button
            type="button"
            className="katha-cta katha-cta--maroon"
            disabled={!reason.trim()}
            onClick={handleSave}
          >
            {ui.saveNote}
          </button>
        </footer>
      </div>
    </div>
  );
}