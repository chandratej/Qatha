import type { ReactElement } from 'react';

export type StudioIllustrationId =
  | 'writer-lamp'
  | 'manuscript-stack'
  | 'chat-thread'
  | 'story-fork'
  | 'laurel-trophy'
  | 'ink-well'
  | 'feather-quill'
  | 'diya-flame'
  | 'palm-scroll'
  | 'open-book';

export type StudioIllustrationTone = 'gold' | 'maroon' | 'neutral';

export interface StudioIllustrationProps {
  id: StudioIllustrationId;
  tone?: StudioIllustrationTone;
  size?: number;
  className?: string;
}

function WriterLamp() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="60" cy="108" rx="36" ry="6" fill="currentColor" opacity="0.12" />
      <path d="M48 52c0-14 5-26 12-32 7 6 12 18 12 32v28H48V52z" fill="currentColor" opacity="0.85" />
      <path d="M44 80h32l-4 18H48l-4-18z" fill="currentColor" opacity="0.55" />
      <ellipse cx="60" cy="44" rx="18" ry="10" fill="currentColor" opacity="0.25" />
      <path d="M54 38c4-8 8-12 6-18 8 2 12 10 10 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function ManuscriptStack() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="28" y="24" width="52" height="72" rx="4" fill="currentColor" opacity="0.18" transform="rotate(-6 54 60)" />
      <rect x="34" y="20" width="52" height="72" rx="4" fill="currentColor" opacity="0.35" transform="rotate(2 60 56)" />
      <rect x="40" y="26" width="52" height="72" rx="4" fill="currentColor" opacity="0.7" />
      <rect x="40" y="26" width="8" height="72" rx="2" fill="currentColor" opacity="0.9" />
      <line x1="54" y1="42" x2="82" y2="42" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <line x1="54" y1="54" x2="78" y2="54" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <line x1="54" y1="66" x2="80" y2="66" stroke="currentColor" strokeWidth="2" opacity="0.25" />
    </svg>
  );
}

function ChatThread() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="16" y="28" width="56" height="28" rx="12" fill="currentColor" opacity="0.22" />
      <rect x="48" y="56" width="56" height="28" rx="12" fill="currentColor" opacity="0.45" />
      <rect x="24" y="84" width="72" height="20" rx="10" fill="currentColor" opacity="0.18" />
      <circle cx="30" cy="42" r="4" fill="currentColor" opacity="0.35" />
      <circle cx="88" cy="70" r="4" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function StoryFork() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="24" r="10" fill="currentColor" opacity="0.7" />
      <path d="M60 34v24M60 58L36 88M60 58L84 88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <circle cx="36" cy="92" r="8" fill="currentColor" opacity="0.35" />
      <circle cx="84" cy="92" r="8" fill="currentColor" opacity="0.35" />
      <rect x="48" y="48" width="24" height="16" rx="6" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

function LaurelTrophy() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M24 72c8-20 20-32 36-36 16 4 28 16 36 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <path d="M42 48c-6 10-8 22-6 34M78 48c6 10 8 22 6 34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      <path d="M48 36h24l-4 28H52L48 36z" fill="currentColor" opacity="0.75" />
      <rect x="44" y="64" width="32" height="10" rx="3" fill="currentColor" opacity="0.55" />
      <rect x="40" y="74" width="40" height="8" rx="2" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function InkWell() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="60" cy="88" rx="32" ry="10" fill="currentColor" opacity="0.15" />
      <path d="M40 52c0-16 8-28 20-32 12 4 20 16 20 32v28c0 8-8 14-20 14s-20-6-20-14V52z" fill="currentColor" opacity="0.6" />
      <path d="M72 40l16-20 6 4-14 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <circle cx="88" cy="18" r="5" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

function FeatherQuill() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M78 18c-8 14-10 30-6 46l-32 32-10-10 32-32c-16-4-32-2-46 6 18-2 34 4 48 16 8-18 6-38-6-58z" fill="currentColor" opacity="0.55" />
      <path d="M40 86l14-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <circle cx="34" cy="94" r="6" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function DiyaFlame() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="60" cy="98" rx="28" ry="6" fill="currentColor" opacity="0.12" />
      <path d="M42 72h36l-6 20H48l-6-20z" fill="currentColor" opacity="0.55" />
      <path d="M60 28c-6 12-8 24-4 36 4-8 8-14 4-24 6 6 10 16 8 28 6-10 4-24-8-40z" fill="currentColor" opacity="0.75" />
      <ellipse cx="60" cy="72" rx="18" ry="4" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

function PalmScroll() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="34" cy="60" rx="10" ry="36" fill="currentColor" opacity="0.2" transform="rotate(-12 34 60)" />
      <ellipse cx="86" cy="60" rx="10" ry="36" fill="currentColor" opacity="0.2" transform="rotate(12 86 60)" />
      <rect x="30" y="32" width="60" height="56" rx="4" fill="currentColor" opacity="0.5" />
      <line x1="42" y1="44" x2="78" y2="44" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="42" y1="56" x2="74" y2="56" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <line x1="42" y1="68" x2="76" y2="68" stroke="currentColor" strokeWidth="2" opacity="0.25" />
    </svg>
  );
}

function OpenBook() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M60 28v64" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M60 28c-22 0-36 10-36 24v40c14-8 28-12 36-12V28z" fill="currentColor" opacity="0.45" />
      <path d="M60 28c22 0 36 10 36 24v40c-14-8-28-12-36-12V28z" fill="currentColor" opacity="0.6" />
      <line x1="44" y1="48" x2="56" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="64" y1="48" x2="76" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

const ILLUSTRATIONS: Record<StudioIllustrationId, () => ReactElement> = {
  'writer-lamp': WriterLamp,
  'manuscript-stack': ManuscriptStack,
  'chat-thread': ChatThread,
  'story-fork': StoryFork,
  'laurel-trophy': LaurelTrophy,
  'ink-well': InkWell,
  'feather-quill': FeatherQuill,
  'diya-flame': DiyaFlame,
  'palm-scroll': PalmScroll,
  'open-book': OpenBook,
};

export function StudioIllustration({
  id,
  tone = 'neutral',
  size = 80,
  className = '',
}: StudioIllustrationProps) {
  const Illustration = ILLUSTRATIONS[id];
  return (
    <span
      className={`studio-illustration studio-illustration--${id} studio-illustration--${tone}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Illustration />
    </span>
  );
}