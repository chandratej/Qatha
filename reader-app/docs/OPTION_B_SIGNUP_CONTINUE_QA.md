# Option B — First signup continues reading (QA checklist)

**Policy:** Proven/unproven free-sample tiering. Soft gate = sign-in at free-sample end (N+1). After signup, reader **must** continue the same chapter. Hard paywall comes later. Subscription only — no chapter coins. WhatsApp: user-initiated only.

**Build under test:** prod-pointed release APK  
`reader-app/build/app/outputs/flutter-apk/app-release.apk`

**API:** `https://katha-api.onrender.com/api`  
**Supabase:** project `qviedmvezaehfcbmfmbc`

---

## 0. Pre-flight (engineer)

| # | Check | Pass |
|---|--------|------|
| 0.1 | API health: `payments_ready=true`, `mock_mode=false` | ☐ |
| 0.2 | Soft-gate copy does **not** say “Chapter 4 only” or “unlimited free after login” | ☐ |
| 0.3 | APK has Google **or** email path works (if no `GOOGLE_WEB_CLIENT_ID`, email is primary) | ☐ |
| 0.4 | At least one **proven-like** story (N≈3) and one **unproven-like** (N≈12) available — or note actual `resolved_free_chapters` from story detail / API | ☐ |

---

## 1. Unproven story (long free sample, default N=12)

| # | Step | Expected | Pass |
|---|------|----------|------|
| 1.1 | Fresh install / clear app data; **do not** sign in | Home loads | ☐ |
| 1.2 | Open unproven story → start Ch 1 | Reads without account | ☐ |
| 1.3 | Read/open through free sample (Ch 1…N) | No sign-in required | ☐ |
| 1.4 | Open chapter **N+1** (first locked free-segment chapter) | Soft gate: “Sign in to continue” — **no** paywall yet | ☐ |
| 1.5 | Tap **Sign in & continue** → complete **first-time** signup (Google **or** email code) | Auth succeeds | ☐ |
| 1.6 | After auth | Same chapter loads; snackbar like “Welcome back — continuing…”; content readable | ☐ |
| 1.7 | Advance through post-auth free window (typically N+1 … paywall−1) | Still free | ☐ |
| 1.8 | Open first **paywall** chapter | Subscribe sheet (hard gate), not soft gate | ☐ |

**Record:** Story title/id: ________  N (free chapters): ________  Soft gate ch: ________  Paywall ch: ________

---

## 2. Proven story (short free sample, N=3)

| # | Step | Expected | Pass |
|---|------|----------|------|
| 2.1 | Sign out (or second device/profile) | Anonymous | ☐ |
| 2.2 | Open proven story Ch 1–3 | Free, no account | ☐ |
| 2.3 | Open Ch 4 (N+1) | Soft gate only | ☐ |
| 2.4 | First-time signup (or sign in with account from §1) | Continue into Ch 4 content | ☐ |
| 2.5 | Ch 5 (if still free window) | Readable without subscribe | ☐ |
| 2.6 | Paywall chapter (typically Ch 6 for N=3) | Subscribe CTA | ☐ |

**Record:** Story title/id: ________  N: ________  Soft gate: ________  Paywall: ________

---

## 3. Promise / copy (both tiers)

| # | Check | Pass |
|---|--------|------|
| 3.1 | Soft gate never claims unlimited free forever | ☐ |
| 3.2 | Soft gate states sign-in is free / payment later | ☐ |
| 3.3 | Auth screen notes you continue from this chapter | ☐ |
| 3.4 | No platform-initiated WhatsApp during this flow | ☐ |

---

## 4. Auth fallback

| # | Step | Expected | Pass |
|---|------|----------|------|
| 4.1 | If Google button missing or fails | Email path works end-to-end | ☐ |
| 4.2 | Cancel auth without signing in | Stay gated; can retry | ☐ |
| 4.3 | Kill app after successful signup; reopen same chapter | Still signed in; chapter loads | ☐ |

---

## 5. Payment smoke (optional same session)

| # | Step | Expected | Pass |
|---|------|----------|------|
| 5.1 | At hard paywall → Subscribe → Razorpay **test** pay | Success path | ☐ |
| 5.2 | Chapter unlocks / Unlimited active | ☐ |
| 5.3 | Razorpay Test Mode webhook delivery **2xx** (dashboard) | ☐ |

---

## Fail criteria (block release to wider testers)

- Signup succeeds but chapter still blocked with soft gate while session is live  
- Soft gate never appears (jumps straight to paywall without continue window) **or** paywall never appears (infinite free)  
- Only Google offered and Google is broken with no email fallback  
- Copy promises unlimited free after login  

---

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Tester | | | Pass / Fail |
| Notes | | | |
