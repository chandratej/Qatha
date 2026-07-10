import type { ReactNode } from 'react';

interface ToolbarTooltipProps {
  label: string;
  children: ReactNode;
}

/** Lightweight hover tooltip for icon-only editor controls (V3 §7). */
export function ToolbarTooltip({ label, children }: ToolbarTooltipProps) {
  return (
    <span className="katha-toolbar-tip">
      {children}
      <span className="katha-toolbar-tip__bubble" role="tooltip">{label}</span>
    </span>
  );
}