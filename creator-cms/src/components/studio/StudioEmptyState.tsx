import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type StudioEmptyVariant = 'default' | 'compact' | 'inline';

export interface StudioEmptyStateProps {
  icon: LucideIcon;
  iconSize?: number;
  title: string;
  titleTe?: string;
  text?: string;
  variant?: StudioEmptyVariant;
  className?: string;
  as?: 'h2' | 'h3';
  children?: ReactNode;
}

export function StudioEmptyState({
  icon: Icon,
  iconSize = 28,
  title,
  titleTe,
  text,
  variant = 'default',
  className,
  as: Heading = 'h3',
  children,
}: StudioEmptyStateProps) {
  const variantClass =
    variant === 'compact' ? ' studio-empty--compact'
    : variant === 'inline' ? ' studio-empty--inline'
    : '';
  const rootClass = `studio-empty studio-empty--v2${variantClass}${className ? ` ${className}` : ''}`;

  return (
    <div className={rootClass}>
      <div className="studio-empty__glyph katha-token-glyph-ring" aria-hidden>
        <Icon size={iconSize} />
      </div>
      <Heading className="studio-empty__title">{title}</Heading>
      {titleTe && (
        <p className="studio-empty__title-te katha-token-subtitle-te" lang="te">{titleTe}</p>
      )}
      {text && <p className="studio-empty__text katha-token-body">{text}</p>}
      {children}
    </div>
  );
}