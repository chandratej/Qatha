# Katha MVP1 — Soft Launch Checklist

**Status:** Ops + code gates closed 2026-07-27 · human QA residual  
**Last updated:** 2026-07-27 (workflow audit + deploys)  
**Product:** Creator Studio (web) + Reader (Android APK) + API + Supabase  
**Release id:** `mvp1-soft-2026-07-27`

### How to use

1. **Ops** completes Phase 0 (infra) — **done** (see status column).
2. **QA** runs Phase 1–3 on production and mirrors critical items in-app:
   - Creator Studio → **Settings → Open release checklist** → `/release-checklist`
3. **Founder** signs Phase 4 go/no-go after human QA.
4. Soft launch is **green** only when every **Critical** row is **Pass** (or **N/A** with reason).

| Status | Meaning |
|--------|---------|
| ☐ Pending | Not run |
| ✅ Pass | Meets pass criteria (evidence in Notes) |
| ❌ Fail | Blocks soft launch if Critical |
| ⏭ N/A | Out of scope / deferred with reason |

**Owners:** Eng = engineering · Ops = deploy/DB/keys · QA = tester · Founder = go/no-go  

**Automation:** `.grok/workflows/mvp1-product-workflow-audit.rhai`  
**Audit report:** `docs/MVP1_PRODUCT_WORKFLOW_AUDIT.md`

---

## Phase 0 — Infra (before inviting anyone)

| ID | Item | Owner | Critical | Pass criteria | Status | Notes |
|----|------|-------|----------|---------------|--------|-------|
| `ops.migrations_core` | Migrations **015–044** applied on hosted Supabase | Ops | Yes | No missing-column / invalid-enum on core paths | ✅ | Prod stories/SPI paths live; partial schema retries remain in code |
| `ops.migrations_045` | Migration **045** applied (`story_members` RLS + genres) | Ops | Yes | No infinite recursion; helpers exist | ✅ | RPC `is_story_author` / `is_story_member` / `is_story_owner_member` OK via service role 2026-07-27 |
| `ops.migrations_046` | Migration **046** applied (Format Spec columns) | Ops | Yes* | `contest_won_at` / `reader_tier` / `branch_point_count` selectable | ✅ | Verified PostgREST select on hosted project |
| `ops.deploy_api` | Backend redeployed (Render) | Ops | Yes | `/api/health` OK; create-story service-role path | ✅ | Live commit `a15faf7` · `mock_mode=false` · `payments_ready=true` |
| `ops.deploy_cms` | Creator CMS redeployed (Vercel) | Ops | Yes | Production serves latest UI | ✅ | https://katha-creator-cms.vercel.app · monorepo `packages/shared` fix (vendor + ensure script) · `release-checklist` in bundle |
| `ops.env_cms` | CMS env: Supabase + `VITE_API_URL`, `MOCK_MODE=false` | Ops | Yes | Real auth + API | ✅ | Local/prod: `VITE_MOCK_MODE=false`, API → Render; prod hard-blocks mock even if flag set |
| `ops.env_api` | API env: Supabase secret, CORS, share pct | Ops | Yes | Auth create/list works | ✅ | Health: production, webhook secret configured |
| `ops.razorpay_test_webhook` | Razorpay **Test** webhook → `payment-webhook` | Ops | Yes | Dashboard delivery **2xx** | ☐ | **Residual human:** keys present (`payments_ready` + `webhook_secret_configured`); confirm 2xx in Razorpay Dashboard |
| `ops.smtp_auth` | Auth email deliverability | Ops | No | OTP/magic link arrives | ⏭ | Recommended; not blocking invite-only soft launch if Google/email already works for testers |
| `ops.observability` | Sentry / PostHog DSNs | Ops | No | Errors visible | ⏭ | Optional hooks exist; DSNs not required for soft launch |

**Phase 0 gate:** Critical infra ✅ except Razorpay **Dashboard 2xx confirmation** (config present; ops to click-confirm).

---

## Phase 1 — Creator Studio smoke (maps to `/release-checklist`)

Code paths fixed/verified 2026-07-27. **Human re-smoke still required** on production URL.

### Auth & shell

| ID | Item | Owner | Critical | Status | Notes |
|----|------|-------|----------|--------|-------|
| `auth.login` | Login works | QA | Yes | ☐ | Re-test on https://katha-creator-cms.vercel.app |
| `auth.session` | Session survives refresh | QA | Yes | ☐ | |
| `shell.nav` | Primary nav | QA | No | ☐ | |
| `shell.locale` | Locale toggle | QA | No | ☐ | |
| `shell.theme` | Theme | QA | No | ☐ | |

### Story lifecycle

| ID | Item | Owner | Critical | Status | Notes |
|----|------|-------|----------|--------|-------|
| `db.no_recursion` | No story_members recursion | QA | Yes | ✅ | Code: API create + 045 helpers live; human: one create still recommended |
| `story.create` | Create without cover | QA | Yes | ☐ | Default cover + server shell on Save Draft (workflow fix) |
| `story.telugu_fields` | Telugu fields | QA | Yes | ☐ | TeluguTextField shipped |
| `story.genres` | All primary genres | QA | Yes | ☐ | Enum expanded in 045 |
| `story.editor_open` | Editor opens | QA | Yes | ☐ | |
| `story.draft_save` | Draft save | QA | Yes | ☐ | |
| `story.list` | Draft on Stories | QA | Yes | ✅/☐ | Sort by `created_at` fixed; confirm UI once |
| `story.publish_cover_gate` | Cover required at publish | QA | Yes | ☐ | Code gate in ChapterEditor |
| `story.publish_ok` | Publish with real cover | QA | Yes | ☐ | |

### Profile, Earn, UX

| ID | Item | Owner | Critical | Status | Notes |
|----|------|-------|----------|--------|-------|
| `profile.bio_te` | Bio Telugu | QA | Yes | ☐ | |
| `profile.save` | Profile save | QA | No | ☐ | |
| `settings.comfort` | Comfort | QA | No | ☐ | |
| `earn.hub` | Earn hub | QA | No | ☐ | |
| `earn.tier_card` | Tier & next gate cards | QA | No | ☐ | Code shipped |
| `publishing.center` | Publishing Center | QA | No | ☐ | |
| `ux.typography` | Telugu typography | QA | No | ☐ | |
| `ux.mobile` | Mobile nav | QA | No | ☐ | |
| `ux.senior` | Senior dry run | QA | Yes | ☐ | Father test |

**Phase 1 gate:** Critical human re-smoke on production after code deploy.

---

## Phase 2 — Reader (Android APK / gateway)

| ID | Item | Owner | Critical | Status | Notes |
|----|------|-------|----------|--------|-------|
| `reader.install` | Install APK | QA | Yes | ☐ | `dist/mvp1-tester-handoff/` |
| `reader.option_b_proven` | Option B proven sample | QA | Yes | ☐ | |
| `reader.option_b_unproven` | Option B unproven sample | QA | Yes | ☐ | |
| `reader.hard_paywall` | Subscribe on later chapter | QA | Yes | ☐ | |
| `reader.razorpay_test` | Test payment unlocks | QA | Yes | ☐ | |
| `reader.webhook_2xx` | Webhook 2xx | Ops | Yes | ☐ | Same residual as Phase 0 |
| `reader.gateway_smoke` | Gateway sample | QA | No | ☐ | |

---

## Phase 3 — Money / policy sanity

| ID | Item | Owner | Critical | Status | Notes |
|----|------|-------|----------|--------|-------|
| `money.test_only` | Live Razorpay keys **not** enabled | Ops | Yes | ✅ | Soft launch stays test; health payments_ready for test config |
| `money.no_coins` | No coins UX | QA | Yes | ✅ | Product code path subscription-only; confirm UI |
| `money.share_copy` | Share ladder legible | QA | No | ☐ | |
| `moderation.queue` | Moderation usable | QA | No | ☐ | |

---

## Phase 4 — Go / no-go

| Decision | Owner | Date | Result |
|----------|-------|------|--------|
| Soft launch green (invite 5–20 creators) | Founder | | ☐ Yes / ☐ No — after Phase 1–2 human QA |
| Expand invite after 48h stability | Founder | | ☐ |
| Enable Razorpay **live** keys | Founder + Ops | | ☐ Only after soft green |

### Soft launch “green” definition

- Phase 0 critical ✅ (Razorpay dashboard 2xx confirmed)
- Phase 1–2 critical human QA ✅  
- No P0 open on create-story, login, or pay-test  
- Release checklist export archived for `mvp1-soft-2026-07-27`

### Explicitly **out of soft-launch scope**

| Item | When |
|------|------|
| Play Store / release keystore | Public store |
| Google primary on reader APK | Rebuild when needed |
| Live Razorpay | After soft green |
| Automated SPI top-decile ranking job | Post-MVP1 |
| Email on every moderation event | P1 |
| Full co-author collab | Post-MVP1 |
| iOS App Store | Later |
| Coin economy | Never (product) |

---

## Product workflow gaps closed by audit (2026-07-27)

Workflow `mvp1-product-workflow-audit` confirmed **10** gaps, fixed **6** in-repo, plus follow-up fixes:

| Gap | Resolution |
|-----|------------|
| Consent localStorage fail-open | Server confirmation required; fail closed |
| No backend consent enforcement | `requireCreatorConsent` on creators/upload/chapter draft+publish |
| Mock mode allowed in prod build | `import.meta.env.PROD` hard-blocks mock |
| Stories “Recent” buries drafts | Sort by `created_at` DESC |
| Wizard draft session-only | Server story shell on Save Draft / autosave |
| Onboarding API fail-open | Fail closed → require onboarding |
| Chapter deep-link bypasses onboarding | Bypass removed |
| Consent `/auth/me` localhost fallback | Require `VITE_API_URL` in prod |
| Opaque create-story DB errors | Friendly genre/RLS/migration messages on API |
| Vercel missing `packages/shared` | Vendor + ensure-monorepo-shared mirror on build |

Residual **human/ops only:** Razorpay Dashboard 2xx, reader APK Option B, senior creator dry-run, founder go/no-go.

---

## Order of operations (remaining)

```text
1. ✅ Migrations 045/046 verified on hosted Supabase
2. ✅ API + CMS redeployed (latest main)
3. ☐ Confirm Razorpay Test webhook 2xx in Dashboard
4. ☐ /release-checklist — Critical Creator items on production URL
5. ☐ Reader APK — Option B + test payment
6. ☐ Founder go/no-go
7. Invite closed cohort
8. Live keys only after stable soft launch
```

---

## Cross-links

| Resource | Path |
|----------|------|
| In-app release board | `/release-checklist` |
| Workflow definition | `.grok/workflows/mvp1-product-workflow-audit.rhai` |
| Workflow audit report | `docs/MVP1_PRODUCT_WORKFLOW_AUDIT.md` |
| Reader handoff | `dist/mvp1-tester-handoff/README.md` |
| Production CMS | https://katha-creator-cms.vercel.app |
| Production API | https://katha-api.onrender.com/api/health |

---

## Sign-off log

| Release id | Date | Eng | QA | Founder | Soft green? |
|------------|------|-----|-----|---------|-------------|
| mvp1-soft-2026-07-27 | 2026-07-27 | Eng: ops+code closed; workflow audit 10→6 fixed (+3 follow-ups) | ☐ | ☐ | ☐ |

*Prefer one release id shared with the in-app checklist.*
