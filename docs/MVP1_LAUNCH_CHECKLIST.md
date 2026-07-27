# Katha MVP1 — Soft Launch Checklist

**Status:** Living go/no-go board for closed soft launch  
**Last updated:** 2026-07-27  
**Product:** Creator Studio (web) + Reader (Android APK) + API + Supabase  

### How to use

1. **Ops** completes Phase 0 (infra) and records Pass/Fail in this file (or a copy).
2. **QA** runs Phase 1–3 in production (or prod-like) and mirrors critical items in-app:
   - Creator Studio → **Settings → Open release checklist** → `/release-checklist`
   - Release id suggestion: `mvp1-soft-YYYY-MM-DD`
3. **Founder** signs Phase 4 go/no-go.
4. Soft launch is **green** only when every **Critical** row is **Pass** (or explicitly **N/A** with reason).

| Status | Meaning |
|--------|---------|
| ☐ Pending | Not run |
| ✅ Pass | Meets pass criteria |
| ❌ Fail | Blocks soft launch if Critical |
| ⏭ N/A | Out of scope for this release (note why) |

**Owners:** Eng = engineering · Ops = deploy/DB/keys · QA = tester (e.g. founder’s father) · Founder = go/no-go  

---

## Phase 0 — Infra (before inviting anyone)

| ID | Item | Owner | Critical | Pass criteria | Status | Notes |
|----|------|-------|----------|---------------|--------|-------|
| `ops.migrations_core` | Migrations **015–044** applied on hosted Supabase | Ops | Yes | No missing-column / invalid-enum errors on create/publish/SPI paths | ☐ | Backlog P0; verify if unsure |
| `ops.migrations_045` | Migration **045** applied (`story_members` RLS + genres) | Ops | Yes | Create story does **not** show infinite recursion on `story_members` | ☐ | `supabase/migrations/045_fix_story_members_rls_genres.sql` |
| `ops.migrations_046` | Migration **046** applied (Format Spec columns) | Ops | Yes* | No schema errors on `contest_won_at` / `interactive_flash` / list stories with new cols | ☐ | *Critical if contest no-reentry / tiers go live |
| `ops.deploy_api` | Backend redeployed (Render) | Ops | Yes | `/api/health` (or base) OK; create-story uses service-role path | ☐ | |
| `ops.deploy_cms` | Creator CMS redeployed (Vercel) | Ops | Yes | Production URL serves latest create/cover/Telugu/tier UI | ☐ | |
| `ops.env_cms` | CMS env: Supabase + `VITE_API_URL`, `MOCK_MODE=false` | Ops | Yes | Real auth + API, not mock OTP-only | ☐ | |
| `ops.env_api` | API env: Supabase secret, CORS, `CREATOR_SHARE_PCT` | Ops | Yes | Authenticated create/list works | ☐ | |
| `ops.razorpay_test_webhook` | Razorpay **Test** webhook → Supabase `payment-webhook` | Ops | Yes | Dashboard shows delivery **2xx**; secret matches edge | ☐ | See handoff + `configure-razorpay-webhook.md` |
| `ops.smtp_auth` | Auth email deliverability | Ops | No | OTP/magic link arrives (or documented alternative) | ☐ | Recommended same week |
| `ops.observability` | Sentry / PostHog DSNs (optional) | Ops | No | Errors visible if configured | ☐ | |

**Phase 0 gate:** all Critical rows ✅ before Phase 1.

---

## Phase 1 — Creator Studio smoke (maps to `/release-checklist`)

In-app board: same **IDs** where noted. Mark both places for one release id.

### Auth & shell

| ID | Item | Owner | Critical | Pass criteria | Status | Notes |
|----|------|-------|----------|---------------|--------|-------|
| `auth.login` | Login (OTP / Google as configured) | QA | Yes | Can enter Studio | ☐ | In-app critical |
| `auth.session` | Session survives hard refresh | QA | Yes | Still logged in after F5 | ☐ | In-app critical |
| `shell.nav` | Primary nav: Dashboard, Stories, Earn | QA | No | All open without crash | ☐ | |
| `shell.locale` | Telugu / English toggle | QA | No | Labels switch | ☐ | |
| `shell.theme` | Light / dark usable | QA | No | No broken contrast on main pages | ☐ | |

### Story lifecycle

| ID | Item | Owner | Critical | Pass criteria | Status | Notes |
|----|------|-------|----------|---------------|--------|-------|
| `db.no_recursion` | No `story_members` recursion on create | QA | Yes | Create succeeds or clear non-RLS error | ☐ | In-app critical |
| `story.create` | Create story **without** cover | QA | Yes | Default cover; editor opens | ☐ | In-app critical |
| `story.telugu_fields` | Telugu in title, one-line detail, నేపథ్యం, themes | QA | Yes | Text saves and displays | ☐ | In-app critical |
| `story.genres` | All primary genres selectable | QA | Yes | Not only romance/family_drama | ☐ | Needs enum / 045 |
| `story.editor_open` | Chapter 1 editor opens after create | QA | Yes | Can type | ☐ | In-app critical |
| `story.draft_save` | Draft autosave / manual save | QA | Yes | Survives refresh | ☐ | In-app critical |
| `story.list` | Draft appears on Stories / Dashboard | QA | Yes | Unpublished shell listed | ☐ | |
| `story.publish_cover_gate` | Publish blocked on default cover | QA | Yes | Clear error until real cover | ☐ | In-app critical |
| `story.publish_ok` | Publish / submit with real cover + content | QA | Yes | Pending review or live per flow | ☐ | In-app critical |

### Profile, Earn, UX

| ID | Item | Owner | Critical | Pass criteria | Status | Notes |
|----|------|-------|----------|---------------|--------|-------|
| `profile.bio_te` | Profile bio accepts Telugu | QA | Yes | Saves | ☐ | In-app critical |
| `profile.save` | Profile persists after refresh | QA | No | | ☐ | |
| `settings.comfort` | UI scale / comfort | QA | No | | ☐ | |
| `earn.hub` | Earn hub opens | QA | No | Reviews / Payouts tabs | ☐ | |
| `earn.tier_card` | Payouts shows **tier & next gate** cards | QA | No | Units + trust + next step readable | ☐ | Format Spec v1 |
| `publishing.center` | Publishing Center loads | QA | No | | ☐ | |
| `ux.typography` | Telugu readable on Create / Profile / Dashboard | QA | No | | ☐ | |
| `ux.mobile` | Mobile tab bar / More sheet | QA | No | Phone width | ☐ | |
| `ux.senior` | Senior dry run: create → write paragraph → save | QA | Yes | No confusion / blocker | ☐ | In-app critical; father test |

**Phase 1 gate:** all Critical Creator rows ✅.

---

## Phase 2 — Reader (Android APK / gateway)

Package: `dist/mvp1-tester-handoff/`  
Detail: `OPTION_B_SIGNUP_CONTINUE_QA.md`

| ID | Item | Owner | Critical | Pass criteria | Status | Notes |
|----|------|-------|----------|---------------|--------|-------|
| `reader.install` | Install MVP1 APK (sideload) | QA | Yes | App opens | ☐ | Email sign-in if no Google in build |
| `reader.option_b_proven` | Option B proven-like free sample | QA | Yes | Soft gate at sample end; signup → **same chapter continues** | ☐ | Handoff must-pass |
| `reader.option_b_unproven` | Option B unproven-like free sample | QA | Yes | Larger free sample behaves; continue after signup | ☐ | Handoff checklist |
| `reader.hard_paywall` | Later chapter shows **subscribe** | QA | Yes | Not another soft gate only | ☐ | |
| `reader.razorpay_test` | One Razorpay **test** payment | QA | Yes | Unlimited/active after payment | ☐ | Test mode only |
| `reader.webhook_2xx` | Webhook delivery 2xx in Razorpay Dashboard | Ops | Yes | Matches edge secret | ☐ | |
| `reader.gateway_smoke` | Web gateway sample chapter (if in scope) | QA | No | Opens | ☐ | In-app `reader.smoke` |

**Phase 2 gate:** all Critical Reader rows ✅.

---

## Phase 3 — Money / policy sanity (soft launch)

| ID | Item | Owner | Critical | Pass criteria | Status | Notes |
|----|------|-------|----------|---------------|--------|-------|
| `money.test_only` | Live Razorpay keys **not** enabled yet | Ops | Yes | Soft launch stays Test mode | ☐ | Live only after green |
| `money.no_coins` | No coin / microtransaction UX | QA | Yes | Subscription path only | ☐ | Product rule |
| `money.share_copy` | Creator share ladder legible (40%→60%) | QA | No | Earn / Settings | ☐ | |
| `moderation.queue` | Moderation list usable (if moderator account) | QA | No | Approve/reject path exists | ☐ | Soft launch may be founder-only |

---

## Phase 4 — Go / no-go

| Decision | Owner | Date | Result |
|----------|-------|------|--------|
| Soft launch green (invite 5–20 creators) | Founder | | ☐ Yes / ☐ No |
| Expand invite after 48h stability | Founder | | ☐ |
| Enable Razorpay **live** keys | Founder + Ops | | ☐ Only after soft green |

### Soft launch “green” definition

- Phase 0–2 **all Critical = Pass**
- No P0 open bugs on create-story, login, or pay-test path  
- Release checklist export archived (Settings → report download) for the release id  

### Explicitly **out of soft-launch scope** (do not block)

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

## Order of operations (copy this)

```text
1. Apply 045 (+ 046) on Supabase
2. Deploy API (Render) + CMS (Vercel)
3. Confirm Razorpay Test webhook 2xx
4. /release-checklist — Critical Creator items
5. Reader APK — Option B + test payment
6. Founder go/no-go
7. Invite closed cohort
8. Live keys only after stable soft launch
```

---

## Cross-links

| Resource | Path |
|----------|------|
| In-app release board | Creator Studio `/release-checklist` (Settings) |
| In-app item source | `creator-cms/src/lib/releaseChecklist.ts` |
| Reader handoff | `dist/mvp1-tester-handoff/README.md` |
| Option B QA | `dist/mvp1-tester-handoff/OPTION_B_SIGNUP_CONTINUE_QA.md` |
| Razorpay webhook | `dist/mvp1-tester-handoff/configure-razorpay-webhook.md` or `scripts/configure-razorpay-webhook.md` |
| Format Spec DEC | `docs/decisions/DEC-030_format_spec_v1_monetization_tiers.md` |
| SQL: story create fix | `supabase/migrations/045_fix_story_members_rls_genres.sql` |
| SQL: format / contest | `supabase/migrations/046_format_spec_v1_gates_tiers.sql` |
| CMS backlog P0 | `creator_cms_backlog.md` |

---

## Sign-off log

| Release id | Date | Eng | QA | Founder | Soft green? |
|------------|------|-----|-----|---------|-------------|
| mvp1-soft-________ | | | | | ☐ |

*Duplicate this table per attempt. Prefer one release id shared with the in-app checklist.*
