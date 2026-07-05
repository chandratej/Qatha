import type { CSSProperties } from 'react';
import { Keyboard, Wand2, Minus, Focus, Clock, HelpCircle, Check, X } from 'lucide-react';
import { formatRelativeTime } from '../../lib/relativeTime';

interface EditorToolbarProps {
  phoneticLive: boolean;
  onTogglePhonetic: () => void;
  onConvertAll: () => void;
  onSceneBreak: () => void;
  onFocus: () => void;
  onHistory: () => void;
  wordCount: number;
  wordGoal: number;
  showWordGoal: boolean;
  onDismissWordGoal: () => void;
  saving: boolean;
  lastSaved: Date | null;
  workspaceMode: string;
  onHidePreview: () => void;
}

const btnStyle: CSSProperties = {
  height: 32,
  padding: '6px 12px',
  border: '1px solid var(--border)',
  borderRadius: 6,
  background: 'transparent',
  fontSize: 13,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
  color: 'var(--ink)',
};

function ToolbarButton({
  active,
  onClick,
  icon,
  label,
  ariaLabel,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      style={{
        ...btnStyle,
        ...(active ? {
          background: 'rgba(196, 160, 82, 0.15)',
          borderColor: 'var(--gold)',
          color: 'var(--gold-dark)',
        } : {}),
        ...(label ? {} : { padding: 0, width: 32, justifyContent: 'center' }),
      }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

export function EditorToolbar({
  phoneticLive,
  onTogglePhonetic,
  onConvertAll,
  onSceneBreak,
  onFocus,
  onHistory,
  wordCount,
  wordGoal,
  showWordGoal,
  onDismissWordGoal,
  saving,
  lastSaved,
  workspaceMode,
  onHidePreview,
}: EditorToolbarProps) {
  const saveLabel = saving
    ? 'Saving…'
    : lastSaved
      ? `All changes saved · ${formatRelativeTime(lastSaved.getTime())}`
      : 'All changes saved';

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
      {/* Row 1 — actions */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 8 }}>
        <ToolbarButton
          active={phoneticLive}
          onClick={onTogglePhonetic}
          icon={<Keyboard size={16} />}
          label="Phonetic live"
        />
        <ToolbarButton onClick={onConvertAll} icon={<Wand2 size={16} />} label="Convert all" />
        <ToolbarButton onClick={onSceneBreak} icon={<Minus size={16} />} label="Scene break" />

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        <ToolbarButton onClick={onFocus} icon={<Focus size={16} />} label="Focus" />
        <ToolbarButton onClick={onHistory} icon={<Clock size={16} />} label="History" />

        <div style={{ flex: 1 }} />

        <ToolbarButton
          onClick={() => {}}
          icon={<HelpCircle size={16} />}
          ariaLabel="Help"
        />
      </div>

      {/* Row 2 — status */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px 8px', fontSize: 13, color: 'var(--ink-muted)' }}>
        {showWordGoal && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {wordCount} / {wordGoal} words · your goal
            <button
              type="button"
              onClick={onDismissWordGoal}
              aria-label="Dismiss word goal"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--ink-muted)', display: 'flex' }}
            >
              <X size={14} />
            </button>
          </span>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!saving && <Check size={14} style={{ color: '#228B57' }} />}
          <span style={{ color: saving ? 'var(--ink-muted)' : '#228B57' }}>{saveLabel}</span>
          {workspaceMode !== 'editor' && (
            <>
              <span>·</span>
              <button
                type="button"
                onClick={onHidePreview}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 13, padding: 0 }}
              >
                Hide preview
              </button>
            </>
          )}
        </span>
      </div>
    </div>
  );
}