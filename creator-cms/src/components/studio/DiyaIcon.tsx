/** Literary streak motif — oil lamp (దీపం) instead of generic fitness flame */

interface Props {
  size?: number;
  className?: string;
}

export function DiyaIcon({ size = 16, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 3c-1.2 2.2-3.4 3.8-3.4 6.2 0 1.2.5 2.3 1.4 3.1.5.4 1.1.7 1.7.7h.6c.6 0 1.2-.3 1.7-.7.9-.8 1.4-1.9 1.4-3.1 0-2.4-2.2-4-3.4-6.2Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M8.5 14.5h7l1.2 5.5H7.3l1.2-5.5Z"
        fill="currentColor"
        opacity="0.75"
      />
      <ellipse cx="12" cy="20.8" rx="5.5" ry="1.2" fill="currentColor" opacity="0.35" />
    </svg>
  );
}