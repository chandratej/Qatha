type BrandMarkSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<BrandMarkSize, string> = {
  xs: 'brand-mark--xs',
  sm: 'brand-mark--sm',
  md: 'brand-mark--md',
  lg: 'brand-mark--lg',
};

interface BrandMarkProps {
  size?: BrandMarkSize;
  className?: string;
  /** Decorative outer ring — use on auth / hero seals */
  ornate?: boolean;
  /** Accessible label when mark is meaningful (default decorative) */
  label?: string;
}

/** Katha brand seal — Telugu క on gold manuscript disc */
export function BrandMark({ size = 'md', className = '', ornate = false, label }: BrandMarkProps) {
  const decorative = !label;
  return (
    <div
      className={`brand-mark ${SIZE_CLASS[size]}${ornate ? ' brand-mark--ornate' : ''}${className ? ` ${className}` : ''}`}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={label}
    >
      {ornate && <span className="brand-mark__ring" aria-hidden />}
      <span className="brand-mark__glyph">క</span>
    </div>
  );
}
