# Creator CMS — Module Backlog

**Product:** Katha Creator CMS (`creator-cms/`)  
**Last updated:** 2026-07-05 (post-Sprint A/B/C completion)  
**Audience:** Engineering, product, founder review  

---

## Executive Summary

| Dimension | Completion | Notes |
|-----------|------------|-------|
| **Editor UX** | ~90% | Scene editor, phonetic, preview, focus mode, version history |
| **Story / chapter lifecycle** | ~85% | Create → write → cloud draft → publish → moderation |
| **Analytics & earnings UI** | ~75% | Dashboard + per-story analytics; mock + prod paths |
| **Moderation** | ~80% | Role gate, Perspective/heuristic scoring, queue UI |
| **Auth & hardening** | ~80% | Pure Supabase + mock OTP; session validation |
| **Overall CMS production readiness** | **~80%** | Soft-launch ready in mock; prod needs Supabase + Perspective key |

**Production path (implemented):** login → onboarding gate → create story (cover upload) → write ch1 → cloud autosave → publish → moderation queue → creator sees status → resubmit with appeal note.

**Demo path:** `VITE_MOCK_MODE=true` → OTP `123456` → RRR demo seasons → local + cloud publish.

---

## Open Decisions — Resolved

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Auth provider | **Pure Supabase** (+ mock OTP for dev) |
| D2 | Seasons model | **Flat chapters for prod**; seasons demo-only (`demo-rrr`) |
| D3 | Scene storage | **Hybrid** — `content_delta.scenes[]` + aggregated HTML on publish |
| D4 | Draft vs publish | **`POST /chapters/:id/draft`** + debounced cloud autosave |
| D5 | Moderation roles | **Role flag** on profiles (`admin` / `moderator` / `creator`) |

---

## Module Status

Priority: **P0** launch blocker · **P1** MVP · **P2** polish · **P3** post-MVP

### 1. Authentication & Session — ✅ Complete (P0/P1)

| Item | Status |
|------|--------|
| Pure Supabase OTP (+ mock `123456`) | ✅ |
| Session validation on load (prod + mock token expiry) | ✅ |
| `onAuthStateChange` profile restore | ✅ |
| Resend OTP 60s cooldown | ✅ |
| Moderation role gate (nav + route + API) | ✅ |
| Device/session limits (Auth ADR) | ⏳ P2 deferred |
| Logout clears IndexedDB option | ✅ Settings page |

### 2. Onboarding — ✅ Complete (P1)

| Item | Status |
|------|--------|
| Protected route + persistent gate (`OnboardingGate`) | ✅ |
| Steps from real auth + API progress | ✅ |
| Auto-redirect new creators | ✅ |
| Step 4 completes on publish/pending | ✅ |
| PostHog-style events (`creator_onboarding_step_completed`) | ✅ |
| Creator profile page | ⏳ P2 — partial via Settings |
| Welcome email | ⏳ P3 |

### 3. Dashboard & Earnings — ✅ Complete (P0/P1)

| Item | Status |
|------|--------|
| Real `earnings_ledger` path (non-mock) | ✅ |
| Milestones mock seed + fallback | ✅ |
| 60/40 split display (`constants.ts`) | ✅ |
| Week-over-week growth (prod computed) | ✅ |
| Payout tooltips | ✅ |
| Empty state zero earnings | ✅ |
| Export CSV | ⏳ P3 |

### 4. Stories List — ✅ Complete (P0/P1)

| Item | Status |
|------|--------|
| Creator-scoped `GET /creators/stories` | ✅ |
| Edit modal (title, genre, schedule) | ✅ |
| Archive/delete with confirmation | ✅ |
| Cover images + moderation badges | ✅ |
| Search + genre filter | ✅ |
| Co-author collaboration | ⏳ P3 |

### 5. Story Creation — ✅ Complete (P0/P1)

| Item | Status |
|------|--------|
| Cover upload `POST /api/upload` | ✅ |
| No error-masking fallback | ✅ |
| Navigate to Chapter 1 editor | ✅ |
| Cover required, GENRES synced | ✅ |
| Description char limit (300) | ✅ |

### 6. Seasons & Chapters — ✅ Complete (P0/P1)

| Item | Status |
|------|--------|
| Flat chapters prod / seasons demo-only | ✅ |
| Load chapters from API | ✅ |
| Story title from API | ✅ |
| Rename / duplicate / delete chapters | ✅ |
| Publish status column | ✅ |
| Metadata sync on draft save | ✅ |
| Bulk chapter ops | ⏳ P2 |
| Serialization schedule UI | ⏳ P3 |

### 7. Chapter Editor — ✅ Complete (P1/P2)

| Item | Status |
|------|--------|
| Scene reorder, editable title, breadcrumbs | ✅ |
| Scene break, link insert, Ctrl+S save draft | ✅ |
| 50k char limit, aggregate HTML publish | ✅ |
| Phonetic semantic alternatives + Teach correction | ✅ |
| AI Assist / Menu stubs | ⏳ P2 — decorative (remove or wire) |
| Collaborative editing | ⏳ P3 |

### 8. Phonetic Input — ✅ Complete (P2)

| Item | Status |
|------|--------|
| Engine + live conversion + suggestions | ✅ |
| `loadPersonalCorrections()` on app init | ✅ |
| Teach correction UI (localStorage) | ✅ |
| Backend persistence per creator | ⏳ P2 |
| Multi-script beyond Telugu | ⏳ P3 |

### 9. Publish & Autosave — ✅ Complete (P0/P1)

| Item | Status |
|------|--------|
| Publish wired + load from API | ✅ |
| Cloud draft autosave | ✅ |
| Save Draft vs Publish | ✅ |
| Moderation status + resubmit + appeal note | ✅ |
| Conflict resolution / offline queue | ⏳ P2 |

### 10. Version History — ✅ Complete (P2 partial)

| Item | Status |
|------|--------|
| IndexedDB 72h window, compare/restore | ✅ |
| Timeline polish / cloud backup | ⏳ P2 |

### 11. Creator Analytics — ✅ Complete (P1/P2)

| Item | Status |
|------|--------|
| Real `chapter_analytics` + drop-off insights | ✅ |
| Date range filter (chapters) | ✅ |
| Deep link to chapter editor | ✅ |
| Analytics events | ✅ |
| A/B title insights | ⏳ P3 |

### 12. Moderation — ✅ Complete (P0/P1)

| Item | Status |
|------|--------|
| Role gate CMS + API | ✅ |
| Perspective API + heuristic fallback | ✅ |
| HTML preview + toxicity score | ✅ |
| Pagination + status filter | ✅ |
| HTML sanitization library | ⏳ P2 |
| Assignment workflow / auto-notify | ⏳ P2 |

### 13. Notifications — Partial (P2)

| Item | Status |
|------|--------|
| In-app bell (milestones) | ✅ |
| Email on publish status | ⏳ P2 |
| Push (PWA) | ⏳ P3 |

### 14. API Integration — ✅ Complete (P0/P1)

| Endpoint | CMS | Backend | Status |
|----------|-----|---------|--------|
| `GET /creators/dashboard` | ✅ | ✅ | ✅ |
| `GET /creators/stories` | ✅ | ✅ | ✅ creator-scoped |
| `POST /creators/stories` | ✅ | ✅ | ✅ |
| `POST /api/upload` | ✅ | ✅ | ✅ |
| `POST /chapters/:id/publish` | ✅ | ✅ | ✅ |
| `POST /chapters/:id/draft` | ✅ | ✅ | ✅ |
| `GET /creators/.../chapters/:num` | ✅ | ✅ | ✅ |
| `GET /engagement/creator-milestones` | ✅ | ✅ | ✅ mock seed |
| `GET /health` | ✅ banner | ✅ | ✅ |
| Seasons CRUD API | — | — | N/A (flat chapters) |

### 15. UI Shell — ✅ Complete (P2)

| Item | Status |
|------|--------|
| Sepia + warm dark mode toggle | ✅ |
| Moderation hidden for non-admin | ✅ |
| Real editor breadcrumbs | ✅ |
| Settings route | ✅ |
| Backend status banner | ✅ |
| Mobile editor optimization | ⏳ P2 partial |
| Dead code removed (`EditorToolbar.tsx`) | ✅ |

### 16. Testing & DevOps — Partial (P1/P2)

| Item | Status |
|------|--------|
| `npm run build` | ✅ |
| Unit tests (phonetic, sceneUtils, api, onboarding) | ✅ 11 tests |
| E2E lifecycle scaffold (API integration) | ✅ |
| Playwright browser E2E | ⏳ P2 |
| Deploy pipeline (Vercel/Netlify) | ⏳ P2 |
| Sentry + PostHog SDK | ⏳ P2 (events fire to backend analytics) |
| Chrome/Safari/Firefox QA checklist | ⏳ P2 manual |

---

## Remaining Work (Post Soft-Launch)

### P2 Polish
- Autosave conflict resolution + offline publish queue
- Phonetic corrections sync to backend
- HTML sanitization in moderation preview (DOMPurify)
- Playwright E2E against live dev stack
- Deploy pipeline + Sentry/PostHog SDK
- Mobile-responsive editor pass
- Remove or implement AI Assist / navbar menu stubs

### P3 Roadmap (unchanged)
- Co-author collaboration, full analytics suite, export CSV
- Welcome email, creator contests, audio/TTS
- Comments/social (DEV-005 deferred)

---

## Traceability — Plan Checkboxes

From MVP Day 7–8 objectives:

- [x] Creators sign up and authenticate (mock + Supabase)
- [x] Creators create stories (title, genre, cover upload)
- [x] Creators write chapters (scene-based editor)
- [x] Creators publish chapters
- [x] Creator analytics visible
- [x] Release schedule selector
- [x] Creator onboarding flow (gated)
- [x] Creator earnings dashboard
- [ ] Testing on Chrome + Safari — manual QA pending

From Production Blueprint Phase 3:

- [x] Perspective API auto-moderation (key + heuristic fallback)
- [ ] Creator auto-save conflict resolution
- [ ] DB migration strategy documented
- [x] Creator events in analytics pipeline

---

## File Reference

| Module | Primary files |
|--------|---------------|
| Auth | `context/AuthContext.tsx`, `pages/Login.tsx` |
| Onboarding gate | `components/OnboardingGate.tsx`, `lib/onboardingStatus.ts` |
| Settings | `pages/Settings.tsx` |
| API | `lib/api.ts`, `lib/analyticsEvents.ts` |
| Backend | `backend/src/routes/creators.js`, `chapters.js`, `moderation.js` |
| Tests | `src/lib/*.test.ts`, `src/e2e/creator-lifecycle.test.ts` |

---

*Backlog reflects Sprint A/B/C completion. Next review after production Supabase deploy + Perspective API key configuration.*