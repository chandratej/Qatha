# Creator CMS — Module Backlog

**Product:** Katha Creator CMS (`creator-cms/`)  
**Last updated:** 2026-07-05  
**Audience:** Engineering, product, founder review  

This document compares **what the plan specifies** against **what is implemented today**, and lists **pending work module by module**. It is derived from:

| Source | Path |
|--------|------|
| 10-day MVP execution plan (Days 7–10) | `Katha_MVP_Architecture_Review_Betterments.md` |
| Production transition (Phase 3: Moderation & CMS) | `Katha_Production_Transition_Technical_Blueprint.md` |
| Feature completion audit | `Katha_MVP_Progress_Report.md` |
| Recorded deviations & decisions | `RESEARCH_DEVIATION_LOG.md` |
| Auth architecture ADR | `katha-auth-architecture-decision_auth.md` |
| Live codebase audit | `creator-cms/src/`, `backend/src/routes/` |

---

## Executive Summary

The Creator CMS has a **strong writing prototype** (scene-based chapter editor, phonetic Telugu input, live preview, focus mode, local version history) but is **not production-complete** for the planned creator lifecycle:

> **Sign up → create story → organize chapters → write → autosave to cloud → publish → moderation → analytics → earnings**

| Dimension | Approx. completion | Notes |
|-----------|-------------------|--------|
| **Editor UX (demo path)** | ~75–90% | Best-built area; exceeds original react-quill spec |
| **Story / chapter lifecycle (production)** | ~25–35% | Publish API exists but CMS never calls it; seasons/chapters are localStorage-only |
| **Analytics & earnings UI** | ~30–40% | Dashboard/analytics pages exist; mostly seed/mock data |
| **Moderation** | ~25–35% | Review UI exists; no Perspective API; no role gating |
| **Auth & production hardening** | ~35–45% | Mock + Supabase paths; session/role gaps |
| **Overall CMS production readiness** | **~40%** | Aligns with platform report (~35% production readiness) |

**Demo path that works today** (`VITE_MOCK_MODE=true`, `storyId=demo-rrr`): login → dashboard → RRR demo → local seasons/chapters → scene editor → local autosave → version history.

**Production path that does not work end-to-end:** create story → write real chapter → publish → see moderation status → reader sees chapter.

---

## Implemented Today (Baseline)

Routes in `creator-cms/src/App.tsx`:

| Route | Page | Shell |
|-------|------|-------|
| `/login` | Login | Public |
| `/onboarding` | Onboarding | Public |
| `/` | Dashboard | Layout |
| `/stories` | Stories | Layout |
| `/stories/new` | CreateStory | Layout |
| `/stories/:storyId` | StorySeasons | Layout |
| `/analytics/:storyId` | Analytics | Layout |
| `/moderation` | Moderation | Layout |
| `/stories/:storyId/chapters/:chapterNum` | ChapterEditor | Full-screen |
| `/stories/:storyId/seasons/:seasonId/chapters/:chapterNum` | ChapterEditor | Full-screen |

**API client methods** (`creator-cms/src/lib/api.ts`): dashboard, stories list, create story, publish chapter, analytics, moderation queue/review, milestones, image upload.

**Local-only systems:** `demoStorage.ts` (seasons/chapters/scenes), IndexedDB version history (`useVersionHistory`), editor prefs (`editorPrefs.ts`).

---

## Module Backlog

Priority key: **P0** = launch blocker · **P1** = MVP plan · **P2** = polish / post-soft-launch · **P3** = post-MVP roadmap

---

### 1. Authentication & Session

**Plan reference:** Day 7 — OTP auth; Auth ADR — Pure Supabase + MSG91 SMS hook  
**Status:** Partial (~50%)

| Done | Pending |
|------|---------|
| Phone OTP UI (2-step) | **P0** Align auth stack: MVP plan assumes Firebase OTP; ADR mandates Pure Supabase — pick one and remove the other path |
| Mock mode (`OTP 123456`) | **P0** Validate Supabase session on app load (localStorage restore does not re-verify token) |
| Supabase `signInWithOtp` + `verifyOtp` | **P1** `onAuthStateChange` should repopulate user profile on session restore |
| Profile upsert to `profiles` | **P1** Resend OTP + rate-limit UX |
| `ApiAuthSync` injects `x-creator-id` / Bearer token | **P1** Enforce `user.role` for admin-only routes (moderation) |
| | **P2** Device/session limits per Auth ADR |
| | **P2** Logout clears IndexedDB draft cache option |

---

### 2. Onboarding & Creator Profile

**Plan reference:** Day 8 — step-by-step onboarding; Day 10 — welcome email  
**Status:** Partial (~30%)

| Done | Pending |
|------|---------|
| 4-step checklist UI (`/onboarding`) | **P1** Auto-redirect new creators to onboarding after first login |
| Progress from `getStories()` (has story / has chapter) | **P1** Step 1 (Phone OTP) hardcoded `done: true` — derive from real auth state |
| Links to create story / skip | **P1** Step 4 (Publish) never auto-completes — wire to `publishChapter` success |
| | **P1** Onboarding should be behind `ProtectedRoute`, not public |
| | **P2** Creator profile page (pen name, bio, payout details placeholder) |
| | **P2** PostHog events: `creator_onboarding_step_completed` |
| | **P3** Welcome email template (Day 10 growth task) |

---

### 3. Dashboard & Earnings Visibility

**Plan reference:** Day 8 — earnings dashboard Day 1; Gap betterment — creator revenue visibility  
**Status:** Partial (~40%)

| Done | Pending |
|------|---------|
| Dashboard page with earnings cards | **P0** Real earnings from `earnings_ledger` when not in mock mode (backend route exists; CMS consumes it) |
| Subscriber history chart (Recharts) | **P1** Milestones API (`/engagement/creator-milestones`) has no mock fallback — dashboard modal fails in pure mock |
| Earnings-by-story table | **P1** 60/40 revenue split display verified against `packages/shared/constants.ts` |
| Milestone celebration modal + acknowledge | **P2** Payout schedule copy (15th monthly) + expected payout amount tooltips |
| Loading skeletons, backend-down error state | **P2** Week-over-week growth when backend sends `week_over_week_growth_pct` |
| | **P2** Empty state for zero-earnings new creators |
| | **P3** Export earnings CSV (post-MVP Week 4 roadmap) |

---

### 4. Stories List & Management

**Plan reference:** Day 7 — creators manage their stories  
**Status:** Partial (~35%)

| Done | Pending |
|------|---------|
| Stories page lists via `GET /api/stories` | **P0** Creator-scoped stories: today returns **all platform stories**, not `author_id` filtered |
| Mock-mode RRR demo card → `/stories/demo-rrr` | **P0** Add `GET /api/creators/stories` (or filter existing endpoint) + wire CMS |
| Links to seasons + analytics per story | **P1** Story edit (title, description, genre, schedule) |
| | **P1** Story delete / archive with confirmation |
| | **P1** Cover image display from API |
| | **P1** Per-story moderation status badge (draft / pending_review / published) |
| | **P2** Story search / filter by genre |
| | **P3** Co-author collaboration (post-MVP Week 2) |

---

### 5. Story Creation

**Plan reference:** Day 7 — title, genre, cover upload, release schedule  
**Status:** Partial (~45%)

| Done | Pending |
|------|---------|
| Form: title, genre, description, schedule, cover preview | **P0** Cover upload: `POST /api/upload` **does not exist** in backend — upload fails silently |
| `api.createStory()` wired | **P0** Remove error-masking fallback in `CreateStory` (`navigate('/stories/story-001')` on any failure) |
| Release schedule selector (weekly/biweekly/irregular/complete) | **P1** Implement upload via Supabase Storage or backend `/api/upload` |
| Navigates to StorySeasons on success | **P1** Button says "Create Story & Write Chapter 1" but lands on seasons — either navigate to editor or fix copy |
| | **P1** Validate cover as required when UI marks it required |
| | **P1** Genre list sync with `packages/shared/constants.ts` `GENRES` |
| | **P2** Story description char limit (300 per `PAYWALL.maxStoryDescChars`) |
| | **P2** Post-create onboarding nudge ("Write Chapter 1 now") |

---

### 6. Seasons & Chapter Organization

**Plan reference:** Original MVP plan is flat chapters; CMS evolved to seasons locally  
**Status:** Partial — demo only (~20% production)

| Done | Pending |
|------|---------|
| Season list with drag-reorder (Framer Motion) | **P0** **Decision required:** seasons are CMS-only (`demoStorage`) — no backend `seasons` table. Either add schema + API or flatten to chapter-only for MVP |
| Chapter list per season with drag-reorder | **P0** Load/save seasons & chapters from API for non-demo `storyId` |
| Add season, add chapter, word/scene counts | **P1** Story title on seasons page hardcoded `'My Story'` for non-demo — fetch from API |
| Reset demo data button | **P1** Chapter delete, rename, duplicate from seasons view |
| `demoStorage.ts` full CRUD | **P1** Chapter publish status column (draft / pending / published / rejected) |
| | **P1** Sync chapter metadata (title, word count, scene count) to backend on save |
| | **P2** Bulk chapter operations |
| | **P3** Serialization schedule UI (daily release — Month 2 roadmap) |

---

### 7. Chapter Editor — Core Writing UX

**Plan reference:** Day 7 — react-quill rich text; evolved spec — scene blocks, preview, focus mode  
**Status:** Mostly complete for demo (~80%)

| Done | Pending |
|------|---------|
| Scene sidebar (search, add, delete, duplicate, reorder via drag handle) | **P1** Scene drag-and-drop reorder — **listed as not implemented** in Progress Report (verify framer-motion `Reorder` works reliably) |
| Scene cards per premium spec (260px sidebar, gold accent, 6-dot + menu) | **P1** Editable **chapter title** in editor header (state exists; no input UI) |
| Quill editor per scene, format toolbar | **P1** Real story/season/chapter names in navbar breadcrumbs (currently static `"Story"`) |
| Live preview pane (device + light/dark themes) | **P1** Scene break (`***`) insert button if not exposed in toolbar |
| Focus / Deep Work Mode | **P2** Preview: sepia / high-contrast themes in `editorPrefs` unused |
| Phonetic live conversion + suggestions | **P2** Format toolbar: Link button has no handler |
| Version history modal (compare, copy, restore) | **P2** Editor navbar Menu / More buttons are decorative |
| Autosave indicator in footer | **P2** **AI Assist** button is a stub |
| Character / word counts | **P2** 50k char limit enforcement per `PAYWALL.maxChapterChars` before publish |
| | **P2** Aggregate scenes → single HTML payload for publish |
| | **P3** Collaborative editing / comments (deferred per DEV-005) |

---

### 8. Phonetic Input System

**Plan reference:** Progress Report — 90% complete; core differentiator  
**Status:** Complete engine / partial UI (~85%)

| Done | Pending |
|------|---------|
| `phonetic.ts` (~880 lines): converter, suggestions, overrides | **P2** `getSemanticAlternatives()` — register/politeness suggestions not in UI |
| Live phonetic in Quill (`applyLivePhoneticToHtml`) | **P2** `loadPersonalCorrections()` never called on app init |
| Floating suggestion dropdown + keyboard nav | **P2** "Teach correction" UI → `setPersonalCorrection()` |
| Convert-all batch action | **P2** Persist personal corrections to backend per creator |
| Toggle phonetic mode in toolbar | **P3** Multi-script support beyond Telugu |

---

### 9. Publish, Draft Sync & Autosave

**Plan reference:** Day 8 — publish → moderation queue; Blueprint Phase 3.3 — conflict resolution  
**Status:** Critical gap (~15%)

| Done | Pending |
|------|---------|
| `api.publishChapter()` defined | **P0** Wire **Publish** button → `api.publishChapter()` with aggregated scene HTML |
| Backend `POST /chapters/:storyId/publish` (mock + Supabase) | **P0** Load chapter content from API when opening editor for real stories |
| Local autosave via `useAutosave` → `demoStorage` | **P0** Cloud draft autosave — explicitly skipped in `useAutosave` ("not implemented yet") |
| Publish adds to moderation queue (backend) | **P1** Separate **Save Draft** vs **Publish** actions (Publish currently aliases local save only) |
| | **P1** Draft endpoint: `POST /chapters/:storyId/draft` (save without moderation) |
| | **P1** Creator-visible moderation status after publish (pending / approved / rejected + notes) |
| | **P1** Appeal / resubmit flow for rejected chapters |
| | **P2** Auto-save conflict resolution (Blueprint Gap 6 — last-write-wins + warning) |
| | **P2** Offline queue: publish when connectivity returns |
| | **P2** Ctrl+S save draft shortcut |

---

### 10. Version History & Local-First Storage

**Plan reference:** Progress Report — 70%; "Zero Data Loss" principle  
**Status:** Partial (~70%)

| Done | Pending |
|------|---------|
| IndexedDB snapshots per scene (`useVersionHistory`) | **P2** Timeline slider polish (Progress Report quick win) |
| 72-hour pruning | **P2** Cross-device version history (cloud backup of snapshots) |
| Compare, copy, restore in modal | **P2** Version labels (auto vs manual save) |
| Debounced saves on content change | **P3** Export chapter history as file |

---

### 11. Creator Analytics

**Plan reference:** Day 8 — chapter breakdown, drop-off %; Week 4 — full analytics suite  
**Status:** Partial (~35%)

| Done | Pending |
|------|---------|
| Analytics page per story | **P1** Real `chapter_analytics` data when not in mock mode |
| Stats cards, chapter table, low-completion warnings | **P1** Drop-off insights from backend (currently computed client-side fallback) |
| Client-side drop-off computation fallback | **P2** Date range filter (7d / 30d / all time) |
| | **P2** Link from analytics row → open chapter in editor |
| | **P2** PostHog creator events: `creator_analytics_view`, `creator_chapter_edit_from_analytics` |
| | **P3** A/B chapter title insights (Week 4 roadmap) |
| | **P3** "Subscription-driving chapters" report (Week 3 roadmap) |

---

### 12. Content Moderation (CMS Surfaces)

**Plan reference:** Day 9–10 — Perspective API + review queue; Phase 3.1  
**Status:** Partial (~30%)

| Done | Pending |
|------|---------|
| Moderation queue page (`GET /moderation/queue`) | **P0** Google Perspective API integration on publish (backend — Blueprint Phase 3.1) |
| Approve / request edits / reject with notes | **P0** Role gate: only `admin` / `moderator` sees `/moderation` nav + route |
| Works with backend mock moderation seed | **P1** Creator-facing "pending review" status on stories/chapters list |
| | **P1** Render chapter HTML preview safely (today shows raw HTML as plain text) |
| | **P1** Toxicity score display in queue |
| | **P2** Pagination, filters (status, story, date) |
| | **P2** Moderation assignment workflow |
| | **P2** Auto-flag notification to creator |
| | **P3** Creator appeal flow |

---

### 13. Notifications (Creator-Facing)

**Plan reference:** Day 9 — FCM; creator events in Blueprint  
**Status:** Minimal (~10%)

| Done | Pending |
|------|---------|
| Backend notification service skeleton | **P2** In-app notification bell for: chapter approved, rejected, new subscriber milestone |
| | **P2** Email on publish status change |
| | **P3** Push for mobile web (if PWA added) |

---

### 14. API Integration & Data Layer (CMS ↔ Backend)

**Plan reference:** Production Blueprint — destroy MOCK_MODE  
**Status:** Partial (~40%)

| API | CMS uses it? | Backend exists? | Pending |
|-----|-------------|-----------------|---------|
| `GET /creators/dashboard` | ✅ | ✅ | Wire real data path |
| `GET /stories` | ✅ | ✅ | **P0** Creator scope filter |
| `POST /creators/stories` | ✅ | ✅ | — |
| `POST /api/upload` | ✅ | ❌ | **P0** Implement |
| `POST /chapters/:id/publish` | ❌ | ✅ | **P0** Wire from editor |
| `GET /creators/analytics/:id` | ✅ | ✅ | — |
| `GET /moderation/queue` | ✅ | ✅ | Role gate |
| `POST /moderation/:id/review` | ✅ | ✅ | — |
| `GET /engagement/creator-milestones` | ✅ | ⚠️ Supabase only | **P1** Mock seed |
| `GET /chapters/:id/:num` (read) | ❌ | ✅ | **P0** Use for editor load |
| Draft save endpoint | ❌ | ❌ | **P1** New endpoint |
| Seasons/chapters CRUD | ❌ | ❌ | **P0** Schema decision + endpoints |
| `checkHealth()` | ❌ | ✅ | **P2** Backend status banner in CMS |

---

### 15. UI Shell, Layout & Navigation

**Plan reference:** UI space optimization; premium editor prototype  
**Status:** Mostly complete (~75%)

| Done | Pending |
|------|---------|
| Collapsible sidebar layout | **P2** Hide moderation link for non-admin roles |
| Dark mode toggle | **P2** Breadcrumb shows real story/chapter context in editor |
| Mock mode badge | **P2** Mobile-responsive editor (Day 8 QA: Chrome + Safari) |
| Error boundary | **P2** Settings route (account, notifications prefs) |
| | **P3** Remove dead code: `EditorToolbar.tsx`, `ChapterEditor_recovered.tsx` |

---

### 16. Testing, QA & DevOps

**Plan reference:** Day 8 — browser testing; Blueprint pre-production checklist  
**Status:** Missing (~5%)

| Done | Pending |
|------|---------|
| `npm run build` (tsc + vite) | **P1** Unit tests: phonetic converter, scene aggregation, API client |
| `oxlint` | **P1** E2E: login → create story → write → publish → moderation |
| | **P1** Editor tests: phonetic suggestions, version restore |
| | **P2** Visual regression for scene cards + editor layout |
| | **P2** Deploy pipeline (Vercel/Netlify per Day 7 plan) |
| | **P2** Sentry + PostHog in CMS |
| | **P2** Chrome + Safari + Firefox manual QA checklist (Day 8) |

---

### 17. Post-MVP / Roadmap (Out of MVP Scope)

Items explicitly deferred in plan documents — track but do not block soft launch:

| Item | Plan source | Priority |
|------|-------------|----------|
| Creator co-author collaboration | Architecture Review Week 2 | P3 |
| Full creator analytics suite + A/B testing | Week 4 | P3 |
| Detailed revenue/payout dashboard | Week 4 | P3 |
| Comments / reviews on chapters | Week 3 (DEV-005: comments deferred) | P3 |
| Social features (follow, like) | Week 3 | P3 |
| Creator contests, premium tier | Month 3 | P3 |
| Audio / TTS for chapters | DEV-009 Phase 2 (Month 4+) | P3 |
| iOS CMS support | N/A (CMS is web; iOS is reader app) | — |

---

## Recommended Build Order (Sprints)

### Sprint A — Production write path (P0, ~1–2 weeks)

1. Creator-scoped stories API + CMS stories list fix  
2. Image upload (Supabase Storage or `/api/upload`)  
3. Load chapter from API in `ChapterEditor`  
4. Aggregate scenes → `publishChapter()` on Publish  
5. Cloud draft autosave (minimum: debounced POST draft)  
6. Remove `CreateStory` error-masking fallback  

**Exit criteria:** A creator can create a story, write Chapter 1, publish, and see it in the moderation queue.

### Sprint B — Creator trust & safety (P0–P1, ~1 week)

1. Perspective API on publish (backend)  
2. Role-based moderation access  
3. Creator-visible moderation status  
4. Auth session validation + onboarding gate  

**Exit criteria:** Publish → pending → approve/reject visible to creator and moderator.

### Sprint C — Organization & polish (P1–P2, ~1–2 weeks)

1. Seasons schema decision + API **or** flatten to chapters-only  
2. Chapter title editing, real breadcrumbs  
3. Milestones mock seed  
4. Analytics real-data path  
5. Editor stubs: Link, AI Assist (or remove)  
6. Phonetic personal corrections UI  

### Sprint D — Hardening (P2, ongoing)

1. Autosave conflict resolution  
2. Test suite + E2E  
3. Deploy pipeline, monitoring  
4. Dead code cleanup  

---

## Open Decisions (Block Backlog Estimation)

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| D1 | Auth provider | Firebase OTP (MVP plan) vs Pure Supabase + MSG91 (ADR) | Login, session, CMS + reader alignment |
| D2 | Seasons model | Backend `seasons` table vs flat `chapters` only | StorySeasons page, API surface, DB schema |
| D3 | Scene storage format | Single HTML chapter vs JSON scene array in DB | Publish payload, reader rendering, analytics |
| D4 | Draft vs publish | Draft endpoint + local-first merge strategy | Autosave, conflict resolution |
| D5 | Moderation roles | Separate admin app vs role flag on creator accounts | `/moderation` access model |

---

## Traceability: Plan Checkboxes Still Open (Creator CMS Scope)

From `Katha_MVP_Architecture_Review_Betterments.md` Day 7–8 objectives:

- [ ] Creators can sign up and authenticate — **partial** (mock works; production auth incomplete)
- [ ] Creators can create stories (title, genre, cover) — **partial** (cover upload broken)
- [ ] Creators can write chapters (rich text editor) — **done** (scene-based editor exceeds spec)
- [ ] Creators can publish chapters — **not done** (API exists; CMS not wired)
- [ ] Creator analytics visible (readers, retention) — **partial** (UI only; mock data)
- [ ] Release schedule selector — **done** (on create form)
- [ ] Creator onboarding flow — **partial** (UI only; not gated)
- [ ] Creator earnings visibility dashboard — **partial** (UI + mock seed)
- [ ] Testing on Chrome + Safari — **not done**

From Production Blueprint Phase 3 (CMS):

- [ ] Perspective API auto-moderation on publish  
- [ ] Creator auto-save conflict resolution  
- [ ] DB migration strategy for schema changes affecting CMS  
- [ ] Creator events in analytics (chapter_published, subscriber_gained)  

---

## File Reference (Implementation Map)

| Module | Primary files |
|--------|---------------|
| Routing | `creator-cms/src/App.tsx` |
| Auth | `creator-cms/src/context/AuthContext.tsx`, `pages/Login.tsx` |
| Dashboard | `pages/Dashboard.tsx` |
| Stories | `pages/Stories.tsx`, `pages/CreateStory.tsx` |
| Seasons | `pages/StorySeasons.tsx`, `lib/demoStorage.ts` |
| Editor | `pages/ChapterEditor.tsx`, `components/Editor/*` |
| Phonetic | `lib/phonetic.ts` |
| API | `lib/api.ts` |
| Autosave | `hooks/useAutosave.ts` |
| Version history | `hooks/useVersionHistory.ts` |
| Backend | `backend/src/routes/creators.js`, `chapters.js`, `moderation.js` |

---

*This backlog should be updated when sprints complete or when plan documents change. Next review recommended after Sprint A exit criteria are met.*