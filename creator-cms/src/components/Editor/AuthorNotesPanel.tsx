import { useState } from 'react';
import { MessageSquare, CheckCircle2, Trash2, Link2 } from 'lucide-react';
import type { StoryAuthorComment } from '../../../../packages/shared/collaboration';
import type { EditorSelectionAnchor } from '../../lib/editorAnchor';

interface AuthorNotesPanelProps {
  comments: StoryAuthorComment[];
  sceneId: string;
  onAdd: (body: string, anchor?: EditorSelectionAnchor) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onCaptureAnchor?: () => EditorSelectionAnchor | null;
  onNoteClick?: (comment: StoryAuthorComment) => void;
  activeCommentId?: string | null;
  disabled?: boolean;
}

export function AuthorNotesPanel({
  comments,
  sceneId,
  onAdd,
  onResolve,
  onDelete,
  onCaptureAnchor,
  onNoteClick,
  activeCommentId = null,
  disabled = false,
}: AuthorNotesPanelProps) {
  const [draft, setDraft] = useState('');
  const [anchor, setAnchor] = useState<EditorSelectionAnchor | null>(null);
  const [busy, setBusy] = useState(false);

  const sceneComments = comments.filter((c) => c.scene_id === sceneId);

  const submit = async () => {
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd(draft.trim(), anchor || undefined);
      setDraft('');
      setAnchor(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="author-notes-panel">
      <span className="author-notes-panel__label">
        <MessageSquare size={14} aria-hidden />
        Author notes
      </span>
      <div className="author-notes-panel__composer">
        {anchor && (
          <p className="author-notes-panel__anchor">
            <Link2 size={12} aria-hidden />
            &ldquo;{anchor.text.length > 60 ? `${anchor.text.slice(0, 60)}…` : anchor.text}&rdquo;
            <button type="button" className="btn btn-ghost" onClick={() => setAnchor(null)}>Clear</button>
          </p>
        )}
        <textarea
          className="cms-input author-notes-panel__input"
          rows={2}
          placeholder="Continuity note for this scene…"
          value={draft}
          disabled={disabled || busy}
          onChange={(e) => setDraft(e.target.value)}
        />
        {onCaptureAnchor && (
          <button
            type="button"
            className="katha-cta katha-cta--soft author-notes-panel__anchor-btn"
            disabled={disabled || busy}
            onClick={() => {
              const captured = onCaptureAnchor();
              if (captured) setAnchor(captured);
            }}
          >
            <Link2 size={14} aria-hidden /> Anchor to selection
          </button>
        )}
        <button
          type="button"
          className="katha-cta katha-cta--soft author-notes-panel__add"
          disabled={disabled || busy || !draft.trim()}
          onClick={() => { void submit(); }}
        >
          Add
        </button>
      </div>
      {sceneComments.length > 0 && (
        <ul className="author-notes-panel__list">
          {sceneComments.map((c) => (
            <li
              key={c.id}
              className={`author-notes-panel__item${c.status === 'resolved' ? ' is-resolved' : ''}${activeCommentId === c.id ? ' is-active' : ''}${(c.selected_text || c.start_offset != null) && onNoteClick ? ' is-clickable' : ''}`}
              onClick={() => {
                if (onNoteClick && (c.selected_text || c.start_offset != null)) onNoteClick(c);
              }}
              onKeyDown={(e) => {
                if (onNoteClick && (e.key === 'Enter' || e.key === ' ') && (c.selected_text || c.start_offset != null)) {
                  e.preventDefault();
                  onNoteClick(c);
                }
              }}
              role={(c.selected_text || c.start_offset != null) && onNoteClick ? 'button' : undefined}
              tabIndex={(c.selected_text || c.start_offset != null) && onNoteClick ? 0 : undefined}
            >
              {c.selected_text && (
                <p className="author-notes-panel__quote">&ldquo;{c.selected_text}&rdquo;</p>
              )}
              <p>{c.body}</p>
              <div className="author-notes-panel__actions">
                {c.status !== 'resolved' && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label="Resolve note"
                    disabled={disabled}
                    onClick={() => { void onResolve(c.id); }}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label="Delete note"
                  disabled={disabled}
                  onClick={() => { void onDelete(c.id); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}