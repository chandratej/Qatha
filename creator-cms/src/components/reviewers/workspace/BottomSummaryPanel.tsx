import { FileText, Save, Send, X } from 'lucide-react';
import { REVIEW_DECISIONS } from '../../../../../packages/shared/reviewer-marketplace';
import type { ReviewSummaryDraft, ReviewWorkspaceMetrics } from '../../../types/reviewWorkspace';
import { bilingualLabel, reviewUiStrings } from '../../../lib/reviewLocale';
import type { ReviewLanguage } from '../../../lib/reviewLanguagePrefs';
import { useReviewLanguage } from './ReviewLanguageBar';
import { ReviewTeluguTextarea } from './ReviewTeluguTextarea';

const TEMPLATES_EN = [
  {
    id: 'strong-hook',
    label: 'Strong opening',
    overall: 'The opening demonstrates strong literary craft with an immediate sense of place.',
    strengths: 'Vivid sensory detail, confident voice, clear stakes.',
    weaknesses: 'Minor pacing hesitation before the inciting moment.',
    recommendation: 'Tighten the transition into the first conflict by one paragraph.',
    decision: 'accept' as const,
  },
  {
    id: 'revision-needed',
    label: 'Needs revision',
    overall: 'Promising material that would benefit from structural refinement.',
    strengths: 'Distinct character perspective, thematic coherence.',
    weaknesses: 'Logic gaps in motivation, dialogue occasionally expository.',
    recommendation: 'Address critical observations before publication.',
    decision: 'minor_revision' as const,
  },
];

const TEMPLATES_TE = [
  {
    id: 'strong-hook',
    label: 'బలమైన ప్రారంభం',
    overall: 'ప్రారంభం వెంటనే స్థలభావాన్ని నిలబెట్టే బలమైన సాహిత్య శైలిని చూపిస్తుంది.',
    strengths: 'స్పష్టమైన ఇంద్రియ వివరాలు, నమ్మకమైన స్వరం, స్పష్టమైన పందాలు.',
    weaknesses: 'ప్రేరేపించే క్షణానికి ముందు చిన్న వేగ సంకోచం.',
    recommendation: 'మొదటి సంఘర్షణకు మారే పేరాను ఒక పేరా తగ్గించి టైట్ చేయండి.',
    decision: 'accept' as const,
  },
  {
    id: 'revision-needed',
    label: 'సవరణ అవసరం',
    overall: 'మంచి సామర్థ్యం ఉన్న పదార్థం — నిర్మాణాత్మక మెరుగుదలతో మరింత బలపడుతుంది.',
    strengths: 'ప్రత్యేక పాత్ర దృక్పథం, అంశ సామరస్యం.',
    weaknesses: 'ప్రేరణలో తార్కిక అంతరాలు, సంభాషణ కొన్నిసార్లు వివరణాత్మకం.',
    recommendation: 'ప్రచురణకు ముందు కీలక గమనాలను పరిష్కరించండి.',
    decision: 'minor_revision' as const,
  },
];

function templatesFor(language: ReviewLanguage) {
  if (language === 'english') return TEMPLATES_EN;
  if (language === 'telugu') return TEMPLATES_TE;
  return TEMPLATES_TE.map((t, i) => ({
    ...t,
    label: `${t.label} · ${TEMPLATES_EN[i]!.label}`,
  }));
}

interface Props {
  summary: ReviewSummaryDraft;
  metrics: ReviewWorkspaceMetrics;
  saving: boolean;
  submitting: boolean;
  submitError?: string | null;
  readOnly?: boolean;
  onClose: () => void;
  onSummaryChange: (patch: Partial<ReviewSummaryDraft>) => void;
  onApplyTemplate: (template: typeof TEMPLATES_EN[number]) => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function BottomSummaryPanel({
  summary,
  metrics,
  saving,
  submitting,
  submitError,
  readOnly = false,
  onClose,
  onSummaryChange,
  onApplyTemplate,
  onSaveDraft,
  onSubmit,
}: Props) {
  const { language, phoneticTelugu } = useReviewLanguage();
  const ui = reviewUiStrings(language);
  const teluguInput = language !== 'english';
  const templates = templatesFor(language);

  const field = (
    label: string,
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    rows: number,
  ) => (
    <label className="rw-finish-field">
      <span>{label}</span>
      {teluguInput ? (
        <ReviewTeluguTextarea
          rows={rows}
          value={value}
          onChange={onChange}
          phoneticLive={phoneticTelugu && !readOnly}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={readOnly}
        />
      ) : (
        <textarea
          className="rw-textarea"
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={readOnly}
        />
      )}
    </label>
  );

  return (
    <div className="rw-finish-sheet rw-finish-sheet--telugu" role="dialog" aria-labelledby="rw-finish-title" lang={teluguInput ? 'te' : 'en'}>
      <header className="rw-finish-sheet__head">
        <FileText size={18} aria-hidden />
        <div>
          <h3 id="rw-finish-title">{ui.finishReview}</h3>
          <p className="rw-finish-sheet__meta">
            {metrics.commentsCount} {bilingualLabel('టిప్పణులు', 'notes', language)}
            {' · '}{metrics.timeSpentMinutes}m
          </p>
        </div>
        <button type="button" className="rw-sheet-panel__close" onClick={onClose} aria-label={bilingualLabel('మూసివేయి', 'Close', language)}>
          <X size={16} />
        </button>
      </header>

      <div className="rw-finish-sheet__body">
        {field(ui.overallAssessment, ui.overallPlaceholder, summary.overallReview, (v) => onSummaryChange({ overallReview: v }), 3)}

        <div className="rw-finish-row">
          {field(ui.strengths, ui.strengthsPlaceholder, summary.strengths, (v) => onSummaryChange({ strengths: v }), 2)}
          {field(ui.weaknesses, ui.weaknessesPlaceholder, summary.weaknesses, (v) => onSummaryChange({ weaknesses: v }), 2)}
        </div>

        {field(ui.recommendation, ui.recommendationPlaceholder, summary.recommendation, (v) => onSummaryChange({ recommendation: v }), 2)}

        <div className={`rw-finish-decision${submitError && !summary.decision ? ' rw-finish-decision--required' : ''}`}>
          <label htmlFor="rw-decision">{ui.councilDecision}</label>
          <select
            id="rw-decision"
            className="cms-select"
            value={summary.decision}
            disabled={readOnly}
            onChange={(e) => onSummaryChange({ decision: e.target.value as ReviewSummaryDraft['decision'] })}
          >
            <option value="">{ui.chooseDecision}</option>
            {REVIEW_DECISIONS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          {!summary.decision && !readOnly && (
            <span className="input-hint rw-finish-decision__hint">
              {bilingualLabel('సమర్పించడానికి నిర్ణయం అవసరం', 'Required to submit', language)}
            </span>
          )}
        </div>

        {!readOnly && (
          <div className="rw-finish-templates">
            <span className="input-hint">{bilingualLabel('త్వరిత ప్రారంభం', 'Quick start', language)}:</span>
            {templates.map((t) => (
              <button key={t.id} type="button" className="studio-chip" onClick={() => onApplyTemplate(t)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {submitError && (
        <p className="rw-finish-sheet__error" role="alert">{submitError}</p>
      )}

      <footer className="rw-finish-sheet__foot">
        {!readOnly && (
          <button type="button" className="katha-cta katha-cta--soft" onClick={onSaveDraft} disabled={saving}>
            <Save size={14} aria-hidden /> {saving ? '…' : bilingualLabel('డ్రాఫ్ట్ సేవ్', 'Save draft', language)}
          </button>
        )}
        <button
          type="button"
          className="katha-cta katha-cta--maroon"
          onClick={onSubmit}
          disabled={submitting || readOnly || !summary.decision}
        >
          <Send size={14} aria-hidden /> {submitting ? '…' : readOnly
            ? bilingualLabel('సమర్పించబడింది', 'Submitted', language)
            : bilingualLabel('సమీక్ష సమర్పించు', 'Submit review', language)}
        </button>
      </footer>
    </div>
  );
}