# Katha product smoke + visual sanity

> Static code review + structured smoke — not a substitute for live browser QA.

- **Surface:** creator-cms
- **Focus:** (full Studio)
- **Fix mode:** report_only

## Functional smoke

Creator Studio’s product surface is wired end-to-end in code for an MVP1 soft-launch smoke path: login → protected shell (legal consent + onboarding gates) → dashboard / create story (cover optional with default) / Telugu fields / editor / earn / settings / release checklist, with production API URL resolution, mock hard-blocked in PROD, root error boundary, theme toggle, comfort prefs, and mobile tab bar. This is static surface verification only—no live browser or production QA was run; human re-smoke on the production CMS URL remains required per docs/MVP1_LAUNCH_CHECKLIST.md.

**Blockers (fail count):** 0

| ID | Result | Evidence |
|---|---|---|
| routes_core_present | pass | creator-cms/src/App.tsx: /login, / (Dashboard), /stories/new (CreateStory), /earn (+ reviews/payouts), /settings, /release-checklist, /profile, chapter editor paths under ProtectedRoute + Layout. |
| legal_consent_gate | pass | App.tsx wraps protected tree in LegalConsentGate; LegalConsentGate.tsx requires server /auth/me DPDP+agreement versions (fail closed), localStorage cache only after confirm; mock uses local only. |
| onboarding_gate | pass | OnboardingGate.tsx always evaluates checkOnboardingRequired (no chapter deep-link bypass); onboardingStatus.ts fail-closed on API error returns true → Navigate to /onboarding. |
| api_url_resolver | pass | api_config.ts resolveStudioApiBase(): prefers VITE_API_URL; PROD rejects localhost env and falls back to PRODUCTION_STUDIO_API_URL https://katha-api.onrender.com/api; gateway same pattern. |
| release_checklist_page | pass | App route /release-checklist → ReleaseChecklist.tsx; lib/releaseChecklist.ts RELEASE_CHECKLIST_ITEMS (auth.login, story.create, etc.); Settings links to /release-checklist. |
| create_story_no_cover_path | pass | CreateStory.tsx: cover optional at create (comment + coverOpts only if uploaded); createStory uses cover_url || defaultStoryCoverUrl(); storyCover.ts default marker; ChapterEditor blocks publish when isMissingOrDefaultCover. |
| telugu_input_path | pass | TeluguTextField.tsx (IME-safe, phonetic optional, lang=te); used in CreateStory.tsx (title/fields) and Profile.tsx bio-style fields. |
| comfort_prefs_wired | pass | comfortPrefs.ts load/save/applyGlobalComfort; main.tsx calls applyGlobalComfort before paint; Settings.tsx comfort controls (uiScale, calmMotion, highContrast, editor font/line/break); ChapterEditor imports comfortPrefs. |
| theme_toggle_present | pass | ThemeContext.tsx ThemeProvider (system/light/dark, toggleTheme); ThemeToggle.tsx; App.tsx wraps with ThemeProvider; AppTopNav + Login mount ThemeToggle; Settings uses setTheme for pref. |
| mock_mode_prod_guard | pass | lib/supabase.ts: isMockMode = import.meta.env.PROD ? false : …; comment ARC-02 hard-blocks VITE_MOCK_MODE in production builds. |
| mobile_tab_bar | pass | AppMobileTabBar.tsx (primary tabs + More sheet from navConfig); Layout.tsx renders <AppMobileTabBar /> under app-shell. |
| error_boundaries | pass | ErrorBoundary.tsx class with reload UI; App.tsx root wraps entire tree in <ErrorBoundary>…</ErrorBoundary>. |
| auth_login_page | pass | pages/Login.tsx: Google + email OTP flows via AuthContext, finishLogin onboarding check, route /login in App.tsx. |
| dashboard_entry | pass | App.tsx path "/" → Dashboard; Dashboard.tsx loads api.getDashboard, stories, milestones; nav primary dashboard route "/". |
| earn_hub_entry | pass | App.tsx /earn with nested reviews/payouts; Earn.tsx hub tabs + Outlet; legacy /reviewers and /monetization redirect into hub. |
| settings_entry | pass | App.tsx /settings → Settings.tsx: comfort, theme pref, devices, payouts fields, link to /release-checklist; nav More includes Settings. |

## Visual / UX dimensions

### visual_communication

Visual communication is strongest on Login CTA hierarchy and CreateStory primary/secondary actions, but status color semantics break down (Dashboard collapses review/revision into draft; library cards use one gold for pending and needs-revision; design-system badge-error equals badge-maroon). Error messaging is inconsistent (Login alerts vs CreateStory plain red text; Settings payout feedback is tone-blind). The legal consent gate and create-meta fields lag bilingual/Telugu clarity relative to the rest of Studio, and primary empty states still bypass the unified empty-state system.

### eye_comfort

Creation/editor eye-comfort is strong: warm paper vs night canvas, Telugu font stacks, global reduced-motion + calm-motion, high-contrast tokens, and chapter-editor type/leading prefs (with spacious Telugu leading). Gaps are outside the manuscript: pure-white management/auth cards reintroduce glare; mobile nav type is too small/muted for senior users; alternate editors ignore comfortPrefs; Settings line-height labels drift from real values; residual soft ink and premium-muted dark tokens can undercut contrast; in-editor controls and default UI scale lag the comfort defaults the product already claims.

### css_consistency

Creator Studio has a real brand/token foundation (brand-tokens + theme + late comfort/eye-comfort layers), but consistency is undermined by parallel palettes (sv21 vs premium), undefined nav prototype tokens, TSX hard-coded colors, unused spacing scale, and a z-index scheme where mobile chrome (9k–10k) sits above all shared modals (1k). Highest priority: fix overlay stacking, bind nav colors to real ink/surface tokens, and collapse maroon/gold + padding ownership to one system.

### ergonomics_a11y

Creator Studio has a solid comfort foundation (UI scale, contrast, reduced motion) and several good a11y primitives (Esc on menus/modals, Login role=alert, some aria-busy loaders, mobile tab bar with safe-area main padding). The highest-impact gaps are incomplete modal/sheet focus management (CmsModal + mobile More), sub-44px touch targets on editor/nav/theme chrome, and Create Story validation that neither associates errors with fields nor explains disabled primary actions. Secondary gaps: Login field–error linkage, Analytics loading announcement, and Telugu overflow risk on tiny mobile tab labels.

## Confirmed findings (survived verification)

| ID | Severity | Area | File | Issue |
|---|---|---|---|---|
| VC-01 | major | visual | `D:\Katha_Enterprise\MVP\creator-cms\src\pages\Dashboard.tsx` | statusBadgeClass only maps published → sv21__badge--published; pending_review and needs_revision both render as sv21__badge--draft despite different text labels. studio-v21.css already defines sv21__badge--review, so dashboard status chips hide action urgency (revision vs waiting vs draft). |
| VC-02 | major | visual | `D:\Katha_Enterprise\MVP\creator-cms\src\components\studio\StoryCardV21.tsx` | statusStamp applies the same sv21__badge--review class to both pending_review and needs_revision. Color no longer encodes meaning: 'waiting on moderators' and 'you must edit' look identical at a glance. |
| VC-03 | major | a11y | `D:\Katha_Enterprise\MVP\creator-cms\src\pages\CreateStory.tsx` | Wizard errors use <p className="cs-v21__error"> without role="alert" or aria-live. Styles are color-only (#b42318 text, no surface/border/icon). Login and Stories use role="alert"; create-flow failures can sit above a sticky CTA bar and be easy to miss. |
| VC-04 | major | ux | `D:\Katha_Enterprise\MVP\creator-cms\src\components\LegalConsentGate.tsx` | Blocking legal gate is English-only (titles, checkbox copy, CTA, errors) while Login and Studio support te/en locale. Tagline uses dense jargon ("DPDP consent + Creator Agreement") without a Telugu summary; first-person DPDP summary sits beside a checkbox, which reads as double-accept confusion. |
| VC-05 | major | css | `D:\Katha_Enterprise\MVP\creator-cms\src\styles\components.css` | .badge-error and .badge-maroon share identical background/color (maroon soft fill). Error/danger and brand-maroon status cannot be distinguished by color alone, weakening semantic badge language across Studio. |
| VC-06 | minor | ux | `D:\Katha_Enterprise\MVP\creator-cms\src\pages\Settings.tsx` | payoutMsg (success and failure) is always var(--ink-soft) with no role="alert". Failed save and successful save look the same; export errors reuse the same muted line. Visual feedback does not communicate outcome. |
| VC-07 | minor | ux | `D:\Katha_Enterprise\MVP\creator-cms\src\pages\CreateStory.tsx` | With locale=te, genres/format guides localize, but age rating and completion status options stay English-only (AGE_RATINGS/STORY_STATUSES .label). Mixed Telugu UI + English critical metadata labels reduces bilingual clarity on the create path. |
| VC-08 | minor | visual | `D:\Katha_Enterprise\MVP\creator-cms\src\pages\Dashboard.tsx` | Primary empty shelf uses ad-hoc sv21__empty (icon + muted 13px paragraph) instead of StudioEmptyState / studio-empty--v2 (glyph ring, title, optional titleTe, CTA placement). Wave-12 empty-state system is underused on Dashboard/Stories, so empty communication feels thinner and less bilingual than designed. |
| EC-01 | major | visual | `D:\Katha_Enterprise\MVP\creator-cms\src\styles\premium-shell.css` | Management shell cards use pure white surfaces (--premium-surface: #ffffff; brand management --katha-mode-surface: #ffffff) while creation mode deliberately uses warm ivory (~#e8e0d0). Dashboard, Settings, Login, and nav menus remain high-luminance glare islands for multi-hour management work despite low-glare editor philosophy. |
| EC-02 | major | a11y | `D:\Katha_Enterprise\MVP\creator-cms\src\styles\nav-v2.css` | Mobile tab bar labels are font-size: 0.625rem with color var(--text-muted, #9c8f7a) on white/near-white chrome. At ~10px, labels fail senior-friendly density and likely WCAG AA for non-decorative UI text, especially for Telugu captions. |

### Evidence & suggestions

#### VC-01

- **Issue:** statusBadgeClass only maps published → sv21__badge--published; pending_review and needs_revision both render as sv21__badge--draft despite different text labels. studio-v21.css already defines sv21__badge--review, so dashboard status chips hide action urgency (revision vs waiting vs draft).
- **Evidence:** Dashboard.tsx L21-24: `if (status === 'published') return 'sv21__badge sv21__badge--published'; return 'sv21__badge sv21__badge--draft';` with L26-30 labeling pending_review/needs_revision separately; L311 applies statusBadgeClass(story.moderation_status). studio-v21.css L126: `.sv21__badge--review { background: var(--sv21-gold-light); color: var(--sv21-gold); }`.
- **Suggestion:** Map pending_review → sv21__badge--review and needs_revision to a distinct revision/warning class (or maroon/warning badge); align with StoryCardV21/ManuscriptCard color semantics.

#### VC-02

- **Issue:** statusStamp applies the same sv21__badge--review class to both pending_review and needs_revision. Color no longer encodes meaning: 'waiting on moderators' and 'you must edit' look identical at a glance.
- **Evidence:** StoryCardV21.tsx lines 13-14: if (s === 'pending_review') return { label: t('stories.statusPendingReview'), className: 'sv21__card-stamp sv21__badge--review' }; if (s === 'needs_revision') return { label: t('stories.statusNeedsRevision'), className: 'sv21__card-stamp sv21__badge--review' };
- **Suggestion:** Add sv21__badge--revision (e.g. turmeric/warning ink) for needs_revision; keep gold/review for pending_review only. Use the same mapping on Dashboard and Stories filters.

#### VC-03

- **Issue:** Wizard errors use <p className="cs-v21__error"> without role="alert" or aria-live. Styles are color-only (#b42318 text, no surface/border/icon). Login and Stories use role="alert"; create-flow failures can sit above a sticky CTA bar and be easy to miss.
- **Evidence:** CreateStory.tsx L487/L629/L683: `{error && <p className="cs-v21__error">{error}</p>}` (no role/aria-live), each immediately before `<div className="cs-v21__actions cs-v21__actions--inline">`. cohesion-wave29.css L331-335: `.cs-v21__error { margin: 0; color: #b42318; font-size: 0.875rem; }`. Login.tsx L277: `role="alert"`; Stories.tsx L123: `role="alert"`. Base `.cs-v21__actions` is position:fixed bottom (L437-451) but `--inline` overrides to position:static (L624-631).
- **Suggestion:** Add role="alert" + aria-live="assertive", reuse cms-error-text or a bordered error strip with icon, and scroll/focus the error when setError fires.

#### VC-04

- **Issue:** Blocking legal gate is English-only (titles, checkbox copy, CTA, errors) while Login and Studio support te/en locale. Tagline uses dense jargon ("DPDP consent + Creator Agreement") without a Telugu summary; first-person DPDP summary sits beside a checkbox, which reads as double-accept confusion.
- **Evidence:** LegalConsentGate.tsx:152-156 h1 'Legal essentials' + tagline 'DPDP consent + Creator Agreement — required before publishing on Katha'; 163-166 checkbox + 'Privacy (DPDP) — {DPDP_CONSENT_SUMMARY}'; 94 error English-only; 211 CTA 'Accept & continue to Creator Studio'. creatorAgreement.ts:15-17 DPDP_CONSENT_SUMMARY = 'I agree to Katha processing…'. No useLocale in this file; Login.tsx uses BRAND.taglineTelugu; LocaleContext supports te|en.
- **Suggestion:** Wire useLocale() for all gate strings; provide short Telugu summaries of DPDP + Creator Agreement; keep full legal English via links; rephrase checkbox labels as "I accept…" with summary below, not first-person prose inside the control.

#### VC-05

- **Issue:** .badge-error and .badge-maroon share identical background/color (maroon soft fill). Error/danger and brand-maroon status cannot be distinguished by color alone, weakening semantic badge language across Studio.
- **Evidence:** .badge-error { background: rgba(107, 35, 56, 0.1); color: var(--katha-maroon); font-weight: 600; } and .badge-maroon { background: rgba(107, 35, 56, 0.1); color: var(--katha-maroon); font-weight: 600; } (components.css ~220-229); used as badge-maroon for Published vs badge-error for Needs edits in StorySeasons.tsx / storyStatus.ts
- **Suggestion:** Differentiate badge-error (e.g. ember/error ink + stronger error fill) from badge-maroon (brand accent). Document a status color legend: success=sage, warning=turmeric, review=gold, error=ember, brand=maroon.

#### VC-06

- **Issue:** payoutMsg (success and failure) is always var(--ink-soft) with no role="alert". Failed save and successful save look the same; export errors reuse the same muted line. Visual feedback does not communicate outcome.
- **Evidence:** Render (always soft ink, no role): `{payoutMsg && (<p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ink-soft)' }}>{payoutMsg}</p>)}` (Settings.tsx ~225-227). Writers: success `setPayoutMsg('Payout details saved...')` (~86); save fail `setPayoutMsg(e instanceof Error ? e.message : 'Could not save payout details')` (~88); export fail `setPayoutMsg(e instanceof Error ? e.message : 'Export failed')` (~121).
- **Suggestion:** Split success vs error styling (sage vs error color), add role="alert" on errors, and optionally a short icon/prefix so save outcome is scannable.

#### VC-07

- **Issue:** With locale=te, genres/format guides localize, but age rating and completion status options stay English-only (AGE_RATINGS/STORY_STATUSES .label). Mixed Telugu UI + English critical metadata labels reduces bilingual clarity on the create path.
- **Evidence:** CreateStory.tsx L520: `{locale === 'te' ? g.labelTelugu : g.label}` for genres; L527: `{AGE_RATINGS.map((a) => <option ...>{a.label}</option>)}`; L548: `{STORY_STATUSES.map((s) => <option ...>{s.label}</option>)}`. content-types.ts L243-256: STORY_STATUSES/AGE_RATINGS are English-only `{ id, label }` (e.g. 'Draft', 'All Ages') with no Telugu fields.
- **Suggestion:** Add labelTelugu (or studioLocale keys) for age ratings and story statuses and select by locale, matching primary genre/format pattern.

#### VC-08

- **Issue:** Primary empty shelf uses ad-hoc sv21__empty (icon + muted 13px paragraph) instead of StudioEmptyState / studio-empty--v2 (glyph ring, title, optional titleTe, CTA placement). Wave-12 empty-state system is underused on Dashboard/Stories, so empty communication feels thinner and less bilingual than designed.
- **Evidence:** Dashboard.tsx L289-296: `{sortedStories.length === 0 ? ( <div className="sv21__empty"> <BookOpen size={26} aria-hidden /> <p>{t('stories.emptyShelfText')}</p> <Link to="/stories/new" className="sv21__cta" ...>{t('stories.createFirst')}</Link> </div> )` vs L188-198 error path using `<StudioEmptyState icon={BookOpen} ... title={t('dashboard.studioPaused')} text={...}>`. studio-v21.css: `.sv21__empty p { font-size: 13px; ... }`.
- **Suggestion:** Replace sv21__empty hubs with StudioEmptyState + title/titleTe/text/CTA children; keep sv21__empty only for compact filter-no-match cases if needed.

#### EC-01

- **Issue:** Management shell cards use pure white surfaces (--premium-surface: #ffffff; brand management --katha-mode-surface: #ffffff) while creation mode deliberately uses warm ivory (~#e8e0d0). Dashboard, Settings, Login, and nav menus remain high-luminance glare islands for multi-hour management work despite low-glare editor philosophy.
- **Evidence:** premium-shell.css L19: --premium-surface: #ffffff; L201-213: .cms-panel/.studio-metric/etc background: var(--premium-surface); L89-95 nav --premium-surface-soft; L131-134 active link --premium-surface. brand-tokens.css management: --katha-mode-surface: #ffffff vs creation --katha-mode-surface:#e6ddcc / --katha-mode-canvas:#e8e0d0.
- **Suggestion:** Warm management surfaces toward ivory/paper (e.g. #f7f2e8 / #faf6ef) and soft-mix pure #fff fallbacks in premium-shell, brand-tokens management mode, and dashboard/auth cards so non-editor chrome matches the low-glare system.

#### EC-02

- **Issue:** Mobile tab bar labels are font-size: 0.625rem with color var(--text-muted, #9c8f7a) on white/near-white chrome. At ~10px, labels fail senior-friendly density and likely WCAG AA for non-decorative UI text, especially for Telugu captions.
- **Evidence:** .app-mobile-tabbar { background: var(--surface, #fff); ... } .app-mobile-tabbar__tab { color: var(--text-muted, #9c8f7a); font-size: 0.625rem; font-weight: 500; ... } (nav-v2.css ~L230–260)
- **Suggestion:** Raise tab labels to ≥0.75–0.8125rem (and larger under data-ui-scale 3–4), use --ink-muted/#3f3a32 (or dark equivalent), and increase hit padding so bottom nav stays readable without relying on icons alone.

## Human residual (cannot fully automate)

1. Live production hard-refresh of Legal Consent + Login (Vercel deploy).
2. Father/senior dry-run: Telugu fields, contrast, comfort controls.
3. Mobile phone: tab bar reach, Create Story form, editor toolbar.
4. Theme toggle light/dark on Dashboard + Editor.
5. `/release-checklist` interactive pass on production URL.

## How to re-run

```
/katha-product-smoke-ux
# or with args:
# { "surface": "creator-cms", "focus": "legal consent", "fix_mode": "report_only" }
```
