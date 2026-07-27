# Katha MVP1 product workflow audit report

Stages audited: auth_onboarding → create_story → write_publish → earn_monetize → reader_funnel → infra_ops.

## Summary

- Raw gaps: 12
- Confirmed: 10
- Fixed: 6
- fix_mode: fix

## Confirmed gaps

### consent-localstorage-failopen (major)
LegalConsentGate treats localStorage as sufficient consent and unlocks Studio when POST /auth/consent fails, so DPDP/Creator Agreement may never be durably recorded.

Evidence: LegalConsentGate: if LOCAL_KEY matches versions, skip server check; submit() catch still setItem(LOCAL_KEY) and setNeedsConsent(false) with comment 'Never permanently trap creators'.

File: `D:\Katha_Enterprise\MVP\creator-cms\src\components\LegalConsentGate.tsx`

### consent-no-backend-enforcement (major)
No requireAuth middleware checks consent versions; creator APIs accept JWT without verified DPDP/agreement. Backend consent may degrade to in-memory storage only.

Evidence: backend authenticate.js has no consent gate; consent.js persistCreatorConsents Path 3 returns storage:'memory' and warns to apply migration 041; auth.js /consent catch also recordMockConsent memory fallback.

File: `D:\Katha_Enterprise\MVP\backend\src\lib\consent.js`

### mock-mode-explicit-prod-allowed (major)
Production builds still enable full mock auth (OTP 123456, demo user) if VITE_MOCK_MODE=true is set at build time—not auto-forced, but no PROD hard-block.

Evidence: supabase.ts: isMockMode = explicitMock !== null ? explicitMock : (PROD ? false : hasPlaceholderConfig()). AuthContext mock branches accept OTP '123456' and persist mock-token-*.

File: `D:\Katha_Enterprise\MVP\creator-cms\src\lib\supabase.ts`

### onboarding-api-fail-open (minor)
checkOnboardingRequired returns false (skip onboarding) on any API error, so new creators can enter Studio without the onboarding funnel when stories fetch fails.

Evidence: onboardingStatus.ts catch { return false }; OnboardingGate navigates to /onboarding only when required===true.

File: `D:\Katha_Enterprise\MVP\creator-cms\src\lib\onboardingStatus.ts`

### onboarding-chapter-deep-link-bypass (minor)
OnboardingGate skips the onboarding check for any path containing '/chapters/', so deep links into the chapter editor never force onboarding.

Evidence: OnboardingGate.tsx: if location.pathname.includes('/chapters/') setChecking(false); return; without evaluating checkOnboardingRequired.

File: `D:\Katha_Enterprise\MVP\creator-cms\src\components\OnboardingGate.tsx`

### onboarding-status-device-local-only (minor)
Onboarding completion is only katha_onboarding_complete in localStorage (plus opportunistic story/chapter heuristics), not a server profile flag—state does not follow the account across devices/browsers.

Evidence: constants ONBOARDING_KEY; Onboarding markComplete localStorage.setItem; checkOnboardingRequired short-circuits on that key.

File: `D:\Katha_Enterprise\MVP\creator-cms\src\pages\Onboarding.tsx`

### consent-me-url-localhost-fallback (minor)
LegalConsentGate /auth/me probe uses VITE_API_URL || http://localhost:3001/api; missing CMS API env in a prod build cannot load server consent and pushes the local fail-open path.

Evidence: LegalConsentGate.tsx fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/me`...); same default pattern in api.ts API_BASE.

File: `D:\Katha_Enterprise\MVP\creator-cms\src\components\LegalConsentGate.tsx`

### list.recent_sort_buries_draft_shells (major)
Stories default sort labeled Recent actually sorts by chapter_count DESC; new unpublished shells (chapter_count 0) sink to the bottom—matches “drafts missing from list” when other stories exist. Dashboard continues/top cards use the same chapter_count sort.

Evidence: Stories.tsx filteredStories: sortFilter recent falls through to return b.chapter_count - a.chapter_count; StoryData has no created_at field despite API fullSelect including created_at; Dashboard.tsx sortedStories/continueStory sort by chapter_count.

File: `D:\Katha_Enterprise\MVP\creator-cms\src\pages\Stories.tsx`

### create.wizard_draft_session_only (major)
Wizard Save Draft / autosave only writes sessionStorage (katha-create-story-draft); no server story row is created, so nothing appears on Stories/Dashboard until Create & Write on step 3.

Evidence: createStoryDraft.ts uses sessionStorage only; CreateStory handleSaveDraft→persistDraft; handleSubmit alone calls api.createStory then clearCreateStoryDraft.

File: `D:\Katha_Enterprise\MVP\creator-cms\src\lib\createStoryDraft.ts`

### api.create_error_opaque_for_enum_rls (minor)
Backend POST /creators/stories throws raw Postgres messages for invalid genre enum / policy failures; friendly migration guidance exists only on sbCreateStory, so CMS often shows cryptic or generic errors.

Evidence: creators.js ~996: throw createAppError('INTERNAL_ERROR', error.message, 500); supabaseData formatStoryInsertError has genre/recursion strings; mapApiError may pass raw or GENERIC_ERROR.

File: `D:\Katha_Enterprise\MVP\backend\src\routes\creators.js`

## Fixes applied

- **consent-localstorage-failopen**: LegalConsentGate no longer treats localStorage as durable consent. Non-mock users must get server confirmation via /auth/me and successful POST /auth/consent before Studio unlocks; failed consent POSTs keep the gate closed with an error instead of fail-open local unlock. Mock mode still uses localStorage only.
- **consent-no-backend-enforcement**: Added requireCreatorConsent middleware that verifies current DPDP + Creator Agreement versions after JWT auth; gated /api/creators, /api/upload, and chapter draft/publish. Removed production in-memory consent fallback (MOCK_MODE only); missing migration 041 now returns 503 CONSENT_STORAGE_UNAVAILABLE.
- **mock-mode-explicit-prod-allowed**: Hard-block mock auth in production builds: isMockMode is always false when import.meta.env.PROD, even if VITE_MOCK_MODE=true was set at build time. Dev/demo still allows explicit mock or placeholder-config fallback. AuthContext OTP 123456 / mock-token paths are thereby unreachable in prod via the existing isMockMode gates.
- **list.recent_sort_buries_draft_shells**: Recent sort and Dashboard continue/top cards now order by created_at DESC instead of chapter_count DESC, so new draft shells (chapter_count 0) surface at the top. StoryData includes optional created_at matching the creator stories API.
- **create.wizard_draft_session_only**: Wizard Save Draft and debounced autosave now create/update an unpublished server story shell (api.createStory / updateStory) when title is valid, persist storyId in sessionStorage draft, and Create & Write reuses that shell so drafts appear on Stories/Dashboard before step-3 submit.
- **onboarding-api-fail-open**: checkOnboardingRequired now fails closed: API errors return true so OnboardingGate still routes new creators into /onboarding (aligned with Login finishLogin). Added unit test for stories-fetch failure.

## Residual human / ops gates

Still require humans even if code is clean: Razorpay Dashboard webhook 2xx, father/senior creator dry-run, reader APK Option B QA, founder go/no-go.
See docs/MVP1_LAUNCH_CHECKLIST.md.

## Identity spoof follow-up (workflow katha-identity-spoof-verify)

**Header-based identity (SVC-AUTH-06):** confirmed closed — JWT only; tests pass.

**Additional finding (IDOR, medium):** `GET /peer-reviews` and `GET /peer-reviews/author-feedback` accepted `query.author_id` for any authenticated user.

**Fix:** `resolveAuthorScope()` — non-staff always scoped to JWT `sub`; only admin/moderator may pass `author_id`. Tests in `platformAuthorScope.test.js` (4/4 pass).
