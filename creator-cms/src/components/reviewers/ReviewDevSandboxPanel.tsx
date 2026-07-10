import { useState } from 'react';
import { FlaskConical, Play, RotateCcw, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { platformApi } from '../../lib/platformApi';
import {
  DEV_SANDBOX_RQI,
  isReviewDevSandbox,
} from '../../lib/reviewDevSandbox';

interface Props {
  authorId: string;
  onSeeded: () => void;
}

export function ReviewDevSandboxPanel({ authorId, onSeeded }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [workspaceLink, setWorkspaceLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isReviewDevSandbox()) return null;

  const handleSeed = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    setWorkspaceLink(null);
    try {
      const result = await platformApi.seedReviewDevScenario(authorId);
      setMessage(result.message);
      setWorkspaceLink(`/reviewers/assignments/${result.assignmentId}`);
      onSeeded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not seed dev data');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    setError(null);
    try {
      await platformApi.resetReviewDevData();
      setMessage('Dev data cleared.');
      setWorkspaceLink(null);
      onSeeded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className="review-dev-fab"
        onClick={() => setOpen(true)}
        title="Dev review sandbox"
        aria-label="Open dev review sandbox"
      >
        <FlaskConical size={16} aria-hidden />
        <span>Dev</span>
      </button>
    );
  }

  return (
    <aside className="review-dev-drawer" aria-labelledby="review-dev-sandbox-title">
      <div className="review-dev-drawer__head">
        <FlaskConical size={16} aria-hidden />
        <h3 id="review-dev-sandbox-title">Dev sandbox</h3>
        <button type="button" className="review-dev-drawer__close" onClick={() => setOpen(false)} aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <p className="review-dev-drawer__hint">
        Local only · RQI {DEV_SANDBOX_RQI} · paid review enabled
      </p>

      {message && (
        <p className="review-dev-drawer__msg" role="status">
          <Sparkles size={12} aria-hidden /> {message}
        </p>
      )}
      {error && <p className="cms-error-text" role="alert">{error}</p>}

      <div className="review-dev-drawer__actions">
        <button
          type="button"
          className="katha-cta katha-cta--maroon katha-cta--compact"
          disabled={busy}
          onClick={() => { void handleSeed(); }}
        >
          <Play size={14} aria-hidden />
          {busy ? 'Loading…' : 'Load demo'}
        </button>
        <button
          type="button"
          className="katha-cta katha-cta--soft katha-cta--compact"
          disabled={busy}
          onClick={() => { void handleReset(); }}
        >
          <RotateCcw size={14} aria-hidden /> Reset
        </button>
      </div>

      {workspaceLink && (
        <Link to={workspaceLink} className="review-dev-drawer__link">
          Open workspace →
        </Link>
      )}
    </aside>
  );
}