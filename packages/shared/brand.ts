/**
 * Katha Brand Identity System — single source of truth
 * Design brief: UI_UX/UI_UX_decisions/Brand Identity/katha-brand-identity_V3.md
 *
 * Positioning: The world’s most celebrated home for Telugu serialized stories —
 * and the creator studio that makes Indian literary craft feel inevitable on a global stage.
 *
 * Brand architecture
 * ──────────────────
 * Master brand ……… Katha / కథ
 * Product brands … Creator Studio · Reader · Gateway
 * Mode system ……… Management · Creation · Reading
 *
 * Personality: calm · premium · literary · trustworthy · creator-first · timeless · proud
 */

export const BRAND_IDENTITY = {
  name: 'Katha',
  nameTelugu: 'కథ',
  mark: 'క',
  /** Short product name shown in CMS chrome */
  productName: 'Creator Studio',
  productNameTelugu: 'రచయిత స్టూడియో',
  /** Emotional brand line — literary, global */
  tagline: 'Stories that stay with you',
  taglineTelugu: 'మనసులో నిలిచే కథలు',
  /** Product / marketplace line — clarity for India market */
  promise: 'Telugu stories. No ads. No coins.',
  promiseTelugu: 'తెలుగు కథలు. యాడ్స్ లేవు. కాయిన్స్ లేవు.',
  /** Creator-facing promise */
  creatorPromise: 'Your craft. Your readers. Your fair share.',
  creatorPromiseTelugu: 'మీ కథ. మీ పాఠకులు. మీ సరైన వాటా.',
  /** Cultural pride line — used sparingly on auth & milestones */
  prideLine: 'Built with pride for Telugu storytellers',
  prideLineTelugu: 'తెలుగు కథకుల కోసం గర్వంతో నిర్మించబడింది',
  personality: [
    'calm',
    'premium',
    'literary',
    'trustworthy',
    'creator-first',
    'timeless',
    'proud',
  ] as const,
  /** Creator Economy charter — every feature reinforces these pillars */
  charter: [
    'Prestige',
    'Literary excellence',
    'Intellectual property ownership',
    'Sustainable earnings',
    'Reader trust',
  ] as const,
  pillars: [
    {
      id: 'craft',
      title: 'Craft over noise',
      description: 'Tools disappear so stories can breathe. Every surface protects attention.',
    },
    {
      id: 'fairness',
      title: 'Fair by design',
      description: 'Story Trust rewards sustained reader value — not publishing alone. No coin gimmicks, no ad pollution.',
    },
    {
      id: 'heritage',
      title: 'Heritage, modern form',
      description: 'Palm-leaf warmth and Telugu typography — not costume, but living culture.',
    },
    {
      id: 'delight',
      title: 'Undisputed delight',
      description: 'Motion, hierarchy, and empty states feel inevitable — never decorative excess.',
    },
  ] as const,
  voice: {
    weAre: ['warm', 'precise', 'respectful of craft', 'quietly confident'],
    weAreNot: ['hypey', 'gimmicky', 'colonial exotic', 'corporate sterile'],
    principles: [
      'Lead with the storyteller’s outcome, not the feature.',
      'Prefer Telugu + English pair when pride or emotion matters.',
      'Never shout. Earn trust with clarity and fairness.',
      'Celebrate culture as living craft, not as decoration.',
    ],
  },
} as const;

export type KathaDesignMode = 'management' | 'creation' | 'reading';

export const DESIGN_MODES: Record<KathaDesignMode, { label: string; surfaces: string[] }> = {
  management: {
    label: 'Management',
    surfaces: ['Dashboard', 'Stories', 'Analytics', 'Publishing', 'Settings', 'Community'],
  },
  creation: {
    label: 'Creation',
    surfaces: ['Chapter Editor', 'Review Mode', 'Planning'],
  },
  reading: {
    label: 'Reading',
    surfaces: ['Reader App', 'Gateway Preview', 'Share Links'],
  },
};

/** Generative AI is disabled for creators until brand + trust guidelines are finalized. */
export const CREATOR_AI = {
  generativeEnabled: false,
  /** Planning notes panel (local-only, non-generative) also hidden while AI is off-brand. */
  planningNotesEnabled: false,
} as const;

export const BRAND_COLORS = {
  gold: '#C4A052',
  goldSoft: '#E8D5A3',
  goldMuted: '#A8864E',
  goldDark: '#9A7B3A',
  maroon: '#6B2338',
  maroonSoft: '#8B3A52',
  turmeric: '#C47A2A',
  ember: '#8B3A62',
  ink: '#1A1814',
  inkSoft: '#4A4540',
  inkMuted: '#8A847C',
  paper: '#FAF8F5',
  paperWarm: '#F5F0E8',
  parchment: '#E8DFC8',
  parchmentCanvas: '#EDE4CF',
  surface: '#FFFFFF',
  /** Cream used on gold CTAs and brand seal glyphs */
  cream: '#FDF8F0',
} as const;

export const BRAND_TYPOGRAPHY = {
  ui: 'Outfit',
  display: 'Fraunces',
  displayFallback: 'Literata',
  reading: 'Noto Serif Telugu',
  readingUi: 'Noto Sans Telugu',
  uiBasePx: 16,
  readingBasePx: 18,
  readingLineHeight: 1.82,
  uiLineHeight: 1.5,
  teluguLetterSpacing: '0.15px',
} as const;

export const BRAND_MOTION = {
  durationFastMs: 150,
  durationMs: 180,
  durationSlowMs: 220,
  /** Entrance choreography for page heroes */
  durationEnterMs: 420,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Slight overshoot for “lamp lit” / milestone moments only */
  easingCelebrate: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
} as const;

export const BRAND_ICONOGRAPHY = {
  family: 'Lucide',
  strokeWidth: 1.75,
  sizes: { sm: 16, md: 18, lg: 20 },
} as const;

/** Copy bank for CMS surfaces — keep in sync with product voice */
export const BRAND_COPY = {
  studioEyebrow: 'తాళపత్ర గ్రంథం · Writer’s studio',
  libraryEyebrow: 'గ్రంథాలయం · Manuscript library',
  emptyStoriesTitle: 'Your shelf is waiting',
  emptyStoriesBody:
    'The first manuscript is the hardest — and the most proud. Start a story that Telugu readers will carry with them.',
  authFooter: 'By continuing you agree to our Terms & Privacy',
  loadingLibrary: 'Opening your library…',
  loadingStudio: 'Lighting your studio…',
  /** Creator Economy — literary patronage, not social gifting */
  patronageCta: 'Become a Patron',
  patronageSubtitle: 'Support authors through literary patronage — not tips or coins.',
  storyTrustEyebrow: 'విశ్వాసం · Story Trust',
  quarterlyPayoutNote: 'Quarterly payouts after fraud review, refund handling, and appeals.',
  monetizationGate: 'Monetization unlocks at Performing trust — earned through reader value.',
} as const;
