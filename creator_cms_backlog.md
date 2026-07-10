# Creator CMS — Module Backlog

**Product:** Katha Creator CMS (`creator-cms/`)  
**Last updated:** 2026-07-10 (Cycle 7)  
**Audience:** Engineering, product, founder review  

---

## Executive Summary

| Dimension | Completion | Notes |
|-----------|------------|-------|
| **Editor UX** | ~92% | Scene editor, phonetic, focus, version local+cloud, conflict modal |
| **Story / chapter lifecycle** | ~90% | Create → write → draft → publish → moderation notify |
| **Analytics & Story Trust** | ~88% | Live SPI panel + recompute; drop-off insights |
| **Monetization / payouts** | ~75% | Ladder copy + eligibility; UPI/KYC form; CSV export; ops payout still manual |
| **Moderation** | ~88% | Role gate, scoring, DOMPurify preview, notify on review |
| **Auth & hardening** | ~85% | Supabase + mock OTP; phonetic cloud sync |
| **Testing / DevOps** | ~85% | Vitest + Playwright multi-browser; vercel.json; dry-run script |
| **Overall CMS soft-launch** | **~88%** | Code ready; production env + keys + migration 015–016 remain |

**Demo path:** `VITE_MOCK_MODE=true` → OTP `123456` → full craft loop.

**Production path:** Supabase auth → create story → editor → publish → moderation → SPI → share.

---

## Cycle 7 delivered (this update)

| Item | Status |
|------|--------|
| Live SPI on Analytics (score, components, Refresh SPI) | ✅ |
| Payout readiness Settings (UPI, legal name, PAN) + earnings CSV | ✅ |
| DOMPurify moderation preview | ✅ |
| Moderation → creator notify (milestones log) | ✅ |
| Cloud version snapshots API + editor throttle backup | ✅ |
| Migration 016 (payout fields + chapter_version_snapshots) | ✅ |
| Sentry/PostHog optional init (`observability.ts`) | ✅ |
| Phonetic cloud sync (already present; migrate on login) | ✅ verified |
| Backlog refresh to match reality | ✅ |

---

## Remaining Work

### P0 — Production go-live (ops, not more CMS features)

| Item | Owner | Notes |
|------|-------|-------|
| Apply migrations **015** + **016** on hosted Supabase | Eng | SPI columns + payout + cloud versions |
| Deploy Creator Studio (`MOCK_MODE=false`) | Eng | `vercel.json` ready; set env |
| `VITE_SENTRY_DSN` / `VITE_POSTHOG_KEY` in prod | Eng | Optional but recommended |
| Perspective API key | Eng | Auto-moderation quality |
| Razorpay live keys + webhook | Eng | Reader money; CMS shows ledger |

### P1 — Next product sprint

| Item | Notes |
|------|-------|
| Premium free/paid chapter controls for creators | Freemium policy UI |
| Email on moderation decision | In-app milestone exists; email deferred |
| Full creator public profile page | Partial via Settings |
| Device/session limits enforcement | Auth ADR |
| Live SPI on Dashboard story cards | Analytics done; dashboard may still heuristic |
| Payout admin verify + quarterly runbook | Product/ops |

### P2 — Polish

| Item | Notes |
|------|-------|
| Mobile/tablet editor pass | Partial |
| Preview parity with reader-app | Typography match |
| Phonetic visual hero further | Label improved Cycle 7 (`తెలుగు · Phonetic`) |
| Bulk chapter ops | Multi-select |
| Version history UI showing cloud snapshots | Backend list exists |
| Manual Safari QA checklist | Playwright covers chromium/firefox/webkit smoke |

### P3 — Post-MVP / Labs

| Item | Notes |
|------|-------|
| Events, Reviewers, Tags, Platform map | Behind Studio Labs flag |
| Co-author collaboration | Deferred |
| Literary patronage live | After Performing cohort |
| Multi-script phonetic | Beyond Telugu |
| TTS / audio | Deferred |
| Comments / social feed | Deferred |

---

## Module Status Snapshot

| Module | Status |
|--------|--------|
| Auth | ✅ Complete |
| Onboarding | ✅ Complete |
| Dashboard | ✅ Complete |
| Stories / Create | ✅ Complete |
| Chapter editor | ✅ Complete (immersion polish ongoing) |
| Phonetic | ✅ Complete (+ cloud sync) |
| Publish / autosave / conflict / offline queue | ✅ Complete |
| Version history local + cloud backup | ✅ Complete (UI cloud list optional) |
| Analytics + SPI live | ✅ Complete |
| Monetization education + eligibility | ✅ Complete |
| Payout readiness form | ✅ Complete (ops payout run still manual) |
| Moderation | ✅ Complete |
| Labs surfaces | ✅ Flagged off by default |
| Notifications | Partial (bell + milestones; email pending) |
| Deploy / observability | Partial (hooks ready; keys/deploy ops) |

---

## File Reference (Cycle 7)

| Area | Files |
|------|--------|
| SPI UX | `pages/Analytics.tsx` |
| Payout | `pages/Settings.tsx`, `backend/.../creators.js` `me/payout` |
| Sanitize | `lib/sanitizeHtml.ts`, `pages/Moderation.tsx` |
| Cloud versions | `lib/cloudVersions.ts`, migration `016_…` |
| Observability | `lib/observability.ts`, `main.tsx` |
| API | `lib/api.ts` |

---

*Backlog refreshed Cycle 7. Next review after production deploy + migration 015–016 apply.*
