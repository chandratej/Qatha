# Katha MVP — Research Deviation Log

> **Purpose:** Track every intentional deviation between MVP build instructions (`Katha_MVP_Architecture_Review_Betterments.md`) and read-only research (`D:\Kata_Enterprise\research\`).  
> **Rule:** Research data is never modified. Deviations require founder decision before finalizing.  
> **Last validated:** June 30, 2026

---

## Validation Status Summary

| Research Source | Status | Notes |
|-----------------|--------|-------|
| `04-mvp-strategy.md` | ⚠️ Partial alignment | Core stack/features match; timing differs |
| `18-implementation-plan.md` | 🔴 Conflict | Phase gates vs 10-day build |
| `11-badge-tier-monetization-validation.md` | ✅ Aligned | Flat ₹99 at launch confirmed |
| `12-user-research-personas.md` | ✅ Aligned | Typography, ritual bonds, offline |
| `05-assumption-validation.md` | ⚠️ Pending data | Surveys not yet run (Gate #1) |

---

## ✅ RESOLVED — Founder Decision Recorded

### DEV-001: Build Before Phase 1 Gate — **IGNORED**

| Field | MVP Instructions | Research (`18-implementation-plan.md`) |
|-------|------------------|--------------------------------------|
| **When to code** | Start Day 1 (10-day execution plan) | "No code before Phase 1 validation" (Day 1–14) |
| **Gate #1 criteria** | Not mentioned | ≥15 A-tier creators, ≥30% WTP, ≥50 waitlist signups |

**Founder decision (2026-06-30):** **Ignore DEV-001** — continue MVP build. Surveys (Gate #1) recommended in parallel but not blocking code.

### DEV-004: Launch Paywall Strategy — **CONFIGURABLE**

| Field | MVP Instructions | Research (`04`, `11`, `18`) |
|-------|------------------|----------------------------|
| **Free tier** | Ch 1–3 free → Ch 4 OTP gate → Ch 6 ₹99 paywall | Ch 1–3 free + **7-day unlimited trial** on signup |
| **Beta period** | Paywall at soft launch (Day 10) | **3-month unlimited** for first 500 users / beta readers |

**Founder decision (2026-06-30):** **Configurable via env** — no code change to switch modes.

| `LAUNCH_OFFER_MODE` | Behavior |
|---------------------|----------|
| `immediate` *(default)* | Ch 6 paywall, no launch trial |
| `seven_day_unlimited` | 7-day full access after OTP signup (MVP doc) |
| `three_month_unlimited` | 90-day trial for first 500 signups (research) |

**Optional overrides:** `LAUNCH_OFFER_TRIAL_DAYS`, `LAUNCH_OFFER_FOUNDING_LIMIT`, `LAUNCH_OFFER_SUBSCRIPTION_GATE_CHAPTER`

**API:** `GET /api/config/launch-offer` · **Health:** `GET /health` includes full `launch_offer` object

**To switch:** set env in `backend/.env`, restart API. Reader app + landing fetch config at runtime.

### DEV-002: Creator Earnings Dashboard — **DAY 1 (MVP)**

| Field | MVP Instructions (Gap 1) | Research (`18-implementation-plan.md`) |
|-------|--------------------------|----------------------------------------|
| **When** | Day 1 — non-negotiable | Month 3 — spreadsheet for 20 creators |

**Founder decision (2026-06-30):** **Day 1 dashboard** — earnings, subscribers, payout date, earnings-by-story, subscriber chart in Creator CMS.

**Implementation:** `GET /creators/dashboard` · CMS `Dashboard.tsx` (Gap 1 betterment)

### DEV-003: Revenue Split — **60/40**

| Field | MVP legal checklist | Research + GTM |
|-------|---------------------|----------------|
| **Creator share** | 70/30 (superseded) | **60% creator / 40% platform** |

**Founder decision (2026-06-30):** **60/40** everywhere — code, CMS, landing, reader paywall copy.

**Implementation:** `backend/src/config/revenue.js` · `CREATOR_SHARE_PCT=60` · `GET /api/config/revenue`

**Note:** Update Creator Agreement / legal docs from 70/30 → 60/40 before launch.

---

### DEV-005: Ratings & Comments — **EXCLUDED**

| Field | MVP Instructions (Gap 5) | Research (`04-mvp-strategy.md` P1) |
|-------|--------------------------|-------------------------------------|
| **Ratings** | Removed for MVP | P1 includes reader reviews/ratings |
| **Comments** | Deferred | Month 2–3 should-ship |

**Founder decision (2026-06-30):** **No star ratings — ever.** **No reader comments — for now.** Social proof = reader count + read time only.

**Implementation:** Zero ratings/comments code paths · `packages/shared/constants.ts` → `SOCIAL_FEATURES`

---

## 🔴 BLOCKING — Awaiting Founder Decision

*None — all founder decisions recorded as of 2026-06-30.*

---

## ⚠️ NON-BLOCKING — Documented, Proceeding

### DEV-006: iOS at Launch

- **MVP:** TestFlight submission Day 10
- **Research:** iOS Month 3–4; Android-first (85%+ market)
- **Action:** Android-first build; iOS scaffold deferred

### DEV-007: Search Feature

- **MVP:** Genre tabs + trending + new releases (Gap 3)
- **Research P1:** Search + genre browse
- **Action:** Genre discovery only at launch; search in Week 2

### DEV-008: Coin System

- **Both:** NEVER — architectural decision confirmed
- **Action:** Zero coin code paths

### DEV-009: Audio / TTS

- **Both:** Phase 2 (Month 4+)
- **Action:** Zero audio code in MVP

### DEV-010: Badge-Tier Reader Pricing

- **Research (`11`):** NO-GO for MVP; flat ₹99 only
- **MVP:** Flat ₹99/month
- **Action:** ✅ Fully aligned

---

## Research Alignment Checklist (Continuous)

Validated against research on each build decision:

- [x] Text-first, Telugu-only MVP
- [x] Flutter (Android) + Node.js + Supabase + Firebase OTP + Razorpay + FCM
- [x] Genres: Romance (60%), Family Drama (20%), Suspense (20%)
- [x] Serialized chapters, 50k char limit, cliffhanger format
- [x] No ads, no coins — brand promise
- [x] Offline cache (WiFi-only, 3 chapters)
- [x] Push notifications (3 triggers)
- [x] Content moderation (3-tier)
- [x] PostHog analytics events defined
- [x] Ritual bond UX — continue reading persisted + scroll resume (S12)
- [x] Creator drop-off analytics insights (Gap 6)
- [x] Creator earnings dashboard Day 1 (DEV-002, Gap 1)
- [x] Revenue split 60/40 locked in code (DEV-003)
- [x] No ratings (ever), no comments (for now) — reader count + read time only (DEV-005)
- [ ] Gate #1 surveys — **not yet executed** (founder action)
- [ ] Creator commitments — **not yet recorded** (founder action)

---

## Change Log

| Date | Dev ID | Change | Decided By |
|------|--------|--------|------------|
| 2026-06-30 | DEV-001–010 | Initial validation log created | Pending founder review |
| 2026-06-30 | DEV-001 | Ignored — continue build per founder | Founder |
| 2026-06-30 | DEV-002 | Day 1 creator earnings dashboard confirmed | Founder |
| 2026-06-30 | DEV-003 | 60/40 revenue split locked (`revenue.js`, `CREATOR_SHARE_PCT`) | Founder |
| 2026-06-30 | DEV-004 | Full configurable launch offer (3 modes + env overrides) | Founder |
| 2026-06-30 | DEV-005 | No ratings ever; no comments for now | Founder |
| 2026-06-30 | — | MOCK_MODE demo layer added for dev without Supabase | Build continuation |
| 2026-06-30 | — | CMS + Flutter wired to live API with offline fallback | Build continuation |
| 2026-06-30 | — | Mock Phone OTP auth (backend → CMS + Flutter); swaps to Firebase when creds added | Build continuation |
| 2026-06-30 | — | Mock Razorpay subscription confirm flow (₹99/UPI ready for sandbox keys) | Build continuation |
| 2026-06-30 | — | Reader app shell + persisted continue-reading + scroll resume (S12 ritual bond) | Aligned with research |
| 2026-06-30 | — | CMS drop-off insights in analytics (Gap 6 betterment) | Aligned with MVP doc |
| 2026-07-01 | — | Backend auth hardening: rate limiting (3/hr), OTP expiry 10m, device fingerprint binding, failure cooldown (blueprint Phase 1) | Production transition, MOCK simulates limits |
| 2026-07-01 | — | Razorpay webhook: signature verify + idempotency via webhook_logs | Production security (Gap 2) |
| 2026-07-01 | — | Added migration 003 for otp_requests/failures, fcm_tokens, cache_inval, progress char_offset | Aligns blueprint Gaps 1,2,3,4 |
| 2026-07-01 | — | Phone auth UX: resend timer, split phone/OTP views, rate limit messaging | Blueprint UI + better UX |
| 2026-07-01 | — | Progress tracking enhanced with last_read_char_offset (pct still primary) | Blueprint Gap 5 prep |
| 2026-07-01 | — | Major UX/perf: cache-first SWR reader loads, in-memory + LRU offline cache, 5-chapter predictive prefetch + app-start prewarm, chunked text + RepaintBoundary, throttled saves, backend in-mem caches + compression + Cache-Control/ETag | Aligned with offline-ritual + "instant" requirements. No research changes. |

---

*Update this file whenever implementation choices diverge from research. Never edit files in `research/`.*