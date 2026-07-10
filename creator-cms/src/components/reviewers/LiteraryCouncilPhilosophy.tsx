import { Shield, Sparkles } from 'lucide-react';
import {
  ANTI_FRAUD_MEASURES,
  COUNCIL_CAREER_LEVELS,
  DOUBLE_BLIND_POLICY,
  LITERARY_COUNCIL_PHILOSOPHY,
  MATCHING_ENGINE_WEIGHTS,
  REVIEW_PAYMENT_WORKFLOW,
} from '../../lib/platformConstants';

export function LiteraryCouncilPhilosophy() {
  return (
    <section className="cms-panel literary-council-philosophy" aria-labelledby="council-philosophy-title">
      <div className="literary-council-philosophy__head">
        <Sparkles size={20} aria-hidden className="literary-council-philosophy__icon" />
        <div>
          <h2 id="council-philosophy-title" className="literary-council-philosophy__title">
            {LITERARY_COUNCIL_PHILOSOPHY.headline}
          </h2>
          <p className="literary-council-philosophy__sub">{LITERARY_COUNCIL_PHILOSOPHY.subline}</p>
        </div>
      </div>
      <ul className="literary-council-philosophy__principles">
        {LITERARY_COUNCIL_PHILOSOPHY.principles.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      <div className="literary-council-philosophy__grid">
        <div>
          <h3 className="dashboard-panel__title">Career progression</h3>
          <ol className="council-career-ladder">
            {COUNCIL_CAREER_LEVELS.map((l) => (
              <li key={l.id}>{l.label}</li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="dashboard-panel__title">Matching engine</h3>
          <dl className="platform-dl">
            <dt>Domain expertise</dt><dd>{MATCHING_ENGINE_WEIGHTS.domainExpertisePct}%</dd>
            <dt>Review Quality Index</dt><dd>{MATCHING_ENGINE_WEIGHTS.reviewQualityIndexPct}%</dd>
            <dt>Story Trust level</dt><dd>{MATCHING_ENGINE_WEIGHTS.storyTrustLevelPct}%</dd>
            <dt>Review experience</dt><dd>{MATCHING_ENGINE_WEIGHTS.reviewExperiencePct}%</dd>
          </dl>
          <p className="input-hint">Top eligible reviewers receive invitations. First three accepting are assigned.</p>
        </div>
        <div>
          <h3 className="dashboard-panel__title">
            <Shield size={16} aria-hidden /> Double blind
          </h3>
          <p className="input-hint">
            Hidden until review completes: {DOUBLE_BLIND_POLICY.hiddenUntilComplete.join(', ').replace(/_/g, ' ')}.
          </p>
        </div>
        <div>
          <h3 className="dashboard-panel__title">Payment workflow</h3>
          <ol className="platform-workflow">
            {REVIEW_PAYMENT_WORKFLOW.map((s) => (
              <li key={s}>{s.replace(/_/g, ' ')}</li>
            ))}
          </ol>
        </div>
      </div>

      <p className="input-hint literary-council-philosophy__fraud">
        Anti-fraud: {ANTI_FRAUD_MEASURES.map((m) => m.replace(/_/g, ' ')).join(' · ')}
      </p>
    </section>
  );
}