/**
 * Post-release smoke + sanity checklist.
 * Progress is stored per release id in localStorage so each ship has its own board.
 */

export type ChecklistItemStatus = 'pending' | 'pass' | 'fail' | 'skip';

export type ChecklistItem = {
  id: string;
  section: string;
  label: string;
  labelTe?: string;
  hint?: string;
  critical?: boolean;
};

export type ChecklistState = {
  releaseId: string;
  releaseLabel: string;
  startedAt: string;
  updatedAt: string;
  notes: string;
  items: Record<string, ChecklistItemStatus>;
  itemNotes: Record<string, string>;
};

export const RELEASE_CHECKLIST_ITEMS: ChecklistItem[] = [
  // Auth & shell
  {
    id: 'auth.login',
    section: 'Auth & shell',
    label: 'Login works (OTP / Google as configured)',
    labelTe: 'లాగిన్ పని చేస్తోంది',
    critical: true,
  },
  {
    id: 'auth.session',
    section: 'Auth & shell',
    label: 'Session survives hard refresh',
    critical: true,
  },
  {
    id: 'shell.nav',
    section: 'Auth & shell',
    label: 'Primary nav loads (Dashboard, Stories, Earn)',
  },
  {
    id: 'shell.locale',
    section: 'Auth & shell',
    label: 'Telugu / English locale toggle works',
  },
  {
    id: 'shell.theme',
    section: 'Auth & shell',
    label: 'Light / dark theme applies without broken contrast',
  },

  // Story lifecycle
  {
    id: 'story.create',
    section: 'Story lifecycle',
    label: 'Create story without cover (default cover applied)',
    labelTe: 'కవర్ లేకుండా కథ సృష్టి',
    critical: true,
  },
  {
    id: 'story.telugu_fields',
    section: 'Story lifecycle',
    label: 'Telugu accepted in title, one-line detail, నేపథ్యం, themes',
    critical: true,
  },
  {
    id: 'story.genres',
    section: 'Story lifecycle',
    label: 'All primary genres selectable (not only romance/family)',
    critical: true,
  },
  {
    id: 'story.editor_open',
    section: 'Story lifecycle',
    label: 'Chapter 1 editor opens after create',
    critical: true,
  },
  {
    id: 'story.draft_save',
    section: 'Story lifecycle',
    label: 'Draft autosave / manual save succeeds',
    critical: true,
  },
  {
    id: 'story.publish_cover_gate',
    section: 'Story lifecycle',
    label: 'Publish blocked until a real cover is set',
    hint: 'Default/placeholder cover must not allow go-live',
    critical: true,
  },
  {
    id: 'story.publish_ok',
    section: 'Story lifecycle',
    label: 'With real cover + content, publish / submit for moderation works',
    critical: true,
  },
  {
    id: 'story.list',
    section: 'Story lifecycle',
    label: 'New story appears on Stories list / Dashboard',
  },

  // Profile & settings
  {
    id: 'profile.bio_te',
    section: 'Profile & settings',
    label: 'Profile bio accepts Telugu',
    critical: true,
  },
  {
    id: 'profile.save',
    section: 'Profile & settings',
    label: 'Profile save persists after refresh',
  },
  {
    id: 'settings.comfort',
    section: 'Profile & settings',
    label: 'Comfort / UI scale settings apply',
  },

  // Monetization / earn (smoke)
  {
    id: 'earn.hub',
    section: 'Earn & ops',
    label: 'Earn hub opens without crash',
  },
  {
    id: 'earn.tier_card',
    section: 'Earn & ops',
    label: 'Payouts shows tier & next-gate cards per story',
    hint: 'Format Spec v1 — units + trust + next step',
  },
  {
    id: 'publishing.center',
    section: 'Earn & ops',
    label: 'Publishing Center loads stories / schedules',
  },

  // Regression / policy
  {
    id: 'db.no_recursion',
    section: 'Backend / DB smoke',
    label: 'No “infinite recursion / story_members” errors on create',
    critical: true,
  },
  {
    id: 'ops.migrations_045',
    section: 'Backend / DB smoke',
    label: 'Migration 045 applied (story_members RLS + genres)',
    hint: 'Supabase SQL: 045_fix_story_members_rls_genres.sql',
    critical: true,
  },
  {
    id: 'ops.deploy_api_cms',
    section: 'Backend / DB smoke',
    label: 'API + CMS redeployed after latest fixes',
    critical: true,
  },
  {
    id: 'api.health',
    section: 'Backend / DB smoke',
    label: 'API health endpoint OK (if using Node API)',
    hint: 'GET /api/health or configured base URL',
  },
  {
    id: 'reader.smoke',
    section: 'Backend / DB smoke',
    label: 'Reader / gateway sample chapter opens (if in scope)',
  },
  {
    id: 'reader.option_b_signup_continue',
    section: 'Reader soft launch',
    label: 'Option B: free sample → signup → same chapter continues',
    hint: 'dist/mvp1-tester-handoff/OPTION_B_SIGNUP_CONTINUE_QA.md',
    critical: true,
  },
  {
    id: 'reader.razorpay_test',
    section: 'Reader soft launch',
    label: 'Razorpay Test payment unlocks subscription',
    hint: 'Test mode only — webhook 2xx required',
    critical: true,
  },
  {
    id: 'reader.webhook_2xx',
    section: 'Reader soft launch',
    label: 'Razorpay Dashboard Test webhook deliveries return 2xx',
    critical: true,
  },

  // UX sign-off
  {
    id: 'ux.typography',
    section: 'UX sign-off',
    label: 'Telugu typography readable on Create Story + Profile + Dashboard',
  },
  {
    id: 'ux.mobile',
    section: 'UX sign-off',
    label: 'Mobile tab bar / More sheet usable on a phone width',
  },
  {
    id: 'ux.senior',
    section: 'UX sign-off',
    label: 'Senior-creator dry run: create → write a paragraph → save (no confusion)',
    critical: true,
  },
];

const STORAGE_PREFIX = 'katha_release_checklist_v1:';
const LATEST_KEY = 'katha_release_checklist_latest_id';

export function listChecklistSections(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of RELEASE_CHECKLIST_ITEMS) {
    if (!seen.has(item.section)) {
      seen.add(item.section);
      out.push(item.section);
    }
  }
  return out;
}

export function createEmptyChecklistState(releaseId: string, releaseLabel: string): ChecklistState {
  const now = new Date().toISOString();
  const items: Record<string, ChecklistItemStatus> = {};
  for (const item of RELEASE_CHECKLIST_ITEMS) items[item.id] = 'pending';
  return {
    releaseId,
    releaseLabel,
    startedAt: now,
    updatedAt: now,
    notes: '',
    items,
    itemNotes: {},
  };
}

export function loadChecklistState(releaseId: string): ChecklistState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + releaseId);
    if (!raw) return null;
    return JSON.parse(raw) as ChecklistState;
  } catch {
    return null;
  }
}

export function saveChecklistState(state: ChecklistState): void {
  const next = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_PREFIX + next.releaseId, JSON.stringify(next));
  localStorage.setItem(LATEST_KEY, next.releaseId);
}

export function getLatestReleaseId(): string | null {
  try {
    return localStorage.getItem(LATEST_KEY);
  } catch {
    return null;
  }
}

export function summarizeChecklist(state: ChecklistState) {
  const total = RELEASE_CHECKLIST_ITEMS.length;
  let pass = 0;
  let fail = 0;
  let skip = 0;
  let pending = 0;
  let criticalFail = 0;
  let criticalPending = 0;

  for (const item of RELEASE_CHECKLIST_ITEMS) {
    const status = state.items[item.id] ?? 'pending';
    if (status === 'pass') pass += 1;
    else if (status === 'fail') {
      fail += 1;
      if (item.critical) criticalFail += 1;
    } else if (status === 'skip') skip += 1;
    else {
      pending += 1;
      if (item.critical) criticalPending += 1;
    }
  }

  const readyToShip = criticalFail === 0 && criticalPending === 0 && fail === 0;
  const blocked = criticalFail > 0 || fail > 0;

  return {
    total,
    pass,
    fail,
    skip,
    pending,
    criticalFail,
    criticalPending,
    readyToShip,
    blocked,
    completionPct: total ? Math.round(((pass + skip) / total) * 100) : 0,
  };
}

export function formatChecklistReport(state: ChecklistState): string {
  const summary = summarizeChecklist(state);
  const lines = [
    `# Katha release checklist — ${state.releaseLabel}`,
    `Release id: ${state.releaseId}`,
    `Started: ${state.startedAt}`,
    `Updated: ${state.updatedAt}`,
    '',
    `Summary: ${summary.pass} pass · ${summary.fail} fail · ${summary.skip} skip · ${summary.pending} pending (${summary.completionPct}%)`,
    `Ship gate: ${summary.readyToShip ? 'READY' : summary.blocked ? 'BLOCKED' : 'IN PROGRESS'}`,
    '',
  ];
  if (state.notes.trim()) {
    lines.push('## Release notes', state.notes.trim(), '');
  }
  let currentSection = '';
  for (const item of RELEASE_CHECKLIST_ITEMS) {
    if (item.section !== currentSection) {
      currentSection = item.section;
      lines.push(`## ${currentSection}`);
    }
    const st = (state.items[item.id] ?? 'pending').toUpperCase();
    const crit = item.critical ? ' [CRITICAL]' : '';
    lines.push(`- [${st}]${crit} ${item.label}`);
    const note = state.itemNotes[item.id]?.trim();
    if (note) lines.push(`  note: ${note}`);
  }
  return lines.join('\n');
}
