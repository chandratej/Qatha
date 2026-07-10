import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BackLink } from '../BackLink';

interface StudioPageHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export function StudioPageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  subtitle,
  backTo,
  backLabel,
  actions,
}: StudioPageHeaderProps) {
  return (
    <header className="studio-page-header">
      <div className={backTo ? 'cms-page-header__with-back' : undefined}>
        {backTo && backLabel && <BackLink to={backTo} label={backLabel} />}
        <div>
          {eyebrow && (
            <p className="studio-page-header__eyebrow">
              {EyebrowIcon && <EyebrowIcon size={14} aria-hidden />}
              {eyebrow}
            </p>
          )}
          <h1 className="studio-page-header__title">{title}</h1>
          {subtitle && <p className="studio-page-header__subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="cms-page-header__actions">{actions}</div>}
    </header>
  );
}