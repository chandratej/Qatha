import { AUTHORING_WORKSPACES, type AuthoringWorkspace } from '../../lib/authoringWorkspace';

interface WorkspaceSwitcherProps {
  value: AuthoringWorkspace;
  onChange: (mode: AuthoringWorkspace) => void;
}

export function WorkspaceSwitcher({ value, onChange }: WorkspaceSwitcherProps) {
  return (
    <div className="katha-workspace-switcher" role="tablist" aria-label="Writing workspace">
      {AUTHORING_WORKSPACES.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          className={`katha-workspace-switcher__btn${value === id ? ' katha-workspace-switcher__btn--active' : ''}`}
          onClick={() => onChange(id)}
          title={`${label} workspace`}
        >
          <span className="katha-workspace-switcher__icon" aria-hidden>{icon}</span>
          <span className="katha-workspace-switcher__label">{label}</span>
        </button>
      ))}
    </div>
  );
}