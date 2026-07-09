import { BookOpen, Crosshair, NotebookPen, PenLine } from 'lucide-react';
import { AUTHORING_WORKSPACES, type AuthoringWorkspace, type WorkspaceIconId } from '../../lib/authoringWorkspace';
import { EDITOR_ICON_STROKE } from '../../lib/editorIcons';

interface WorkspaceSwitcherProps {
  value: AuthoringWorkspace;
  onChange: (mode: AuthoringWorkspace) => void;
}

const WORKSPACE_ICONS: Record<WorkspaceIconId, typeof NotebookPen> = {
  notebook: NotebookPen,
  pen: PenLine,
  focus: Crosshair,
  'book-open': BookOpen,
};

export function WorkspaceSwitcher({ value, onChange }: WorkspaceSwitcherProps) {
  return (
    <div className="katha-workspace-switcher" role="tablist" aria-label="Writing workspace">
      {AUTHORING_WORKSPACES.map(({ id, label, icon }) => {
        const Icon = WORKSPACE_ICONS[icon];
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={value === id}
            className={`katha-workspace-switcher__btn${value === id ? ' katha-workspace-switcher__btn--active' : ''}`}
            onClick={() => onChange(id)}
            title={`${label} workspace`}
          >
            <span className="katha-workspace-switcher__icon" aria-hidden>
              <Icon size={15} strokeWidth={EDITOR_ICON_STROKE} />
            </span>
            <span className="katha-workspace-switcher__label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}