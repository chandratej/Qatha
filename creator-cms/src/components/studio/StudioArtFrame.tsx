import type { ReactNode } from 'react';
import { StudioIllustration, type StudioIllustrationId, type StudioIllustrationTone } from './StudioIllustration';

export type StudioArtFrameVariant = 'reader' | 'hero' | 'card';

export interface StudioArtFrameProps {
  illustration: StudioIllustrationId;
  tone?: StudioIllustrationTone;
  variant?: StudioArtFrameVariant;
  children: ReactNode;
  className?: string;
}

export function StudioArtFrame({
  illustration,
  tone = 'maroon',
  variant = 'card',
  children,
  className = '',
}: StudioArtFrameProps) {
  return (
    <div className={`studio-art-frame studio-art-frame--${variant}${className ? ` ${className}` : ''}`}>
      <div className="studio-art-frame__backdrop" aria-hidden>
        <span className="studio-art-frame__glow studio-art-frame__glow--gold" />
        <span className="studio-art-frame__glow studio-art-frame__glow--maroon" />
        <StudioIllustration id={illustration} tone={tone} size={variant === 'reader' ? 120 : 88} className="studio-art-frame__illus" />
      </div>
      <div className="studio-art-frame__content">{children}</div>
    </div>
  );
}