# Katha product smoke + visual sanity

> Static code review + structured smoke — not a substitute for live browser QA.

- **Surface:** creator-cms
- **Focus:** (full Studio)
- **Fix mode:** report_only

## Functional smoke

Static code smoke of Creator Studio shows a complete MVP1 soft-launch surface: core routes and gates (legal consent fail-closed, onboarding fail-closed), prod-safe API base resolver, mock hard-block in PROD, create-story without cover via default cover, TeluguTextField paths, comfort/theme wiring, mobile tab bar, root error boundary, and Dashboard/Earn/Settings/Release Checklist entry points. In code terms Studio can be smoke-tested end-to-end along login → gates → create → editor → earn/settings; this does not claim live browser or production QA passed—human re-smoke on the deployed URL remains required per the launch checklist.

**Blockers (fail count):** 0

| ID | Result | Evidence |
|---|---|---|
| routes_core_present | pass | App.tsx: /login, / (Dashboard), /stories/new (CreateStory), chapter editor routes, /earn, /settings, /profile, /release-checklist; ProtectedRoute → LegalConsentGate → OnboardingGate → Layout |
| legal_consent_gate | pass | LegalConsentGate.tsx: wraps protected tree; prod requires /auth/me DPDP+agreement versions (fail-closed); submit via api.recordConsent; mock allows localStorage only; UI checkboxes + Accept |
| onboarding_gate | pass | OnboardingGate.tsx: BYPASS only /onboarding|/login; always checkOnboardingRequired including editors; onboardingStatus.ts catch returns true (fail-closed) |
| api_url_resolver | pass | api_config.ts resolveStudioApiBase(): VITE_API_URL preferred; PROD blocks localhost env and falls back to PRODUCTION_STUDIO_API_URL https://katha-api.onrender.com/api; used by LegalConsentGate |
| release_checklist_page | pass | App.tsx route /release-checklist → ReleaseChecklist.tsx; lib/releaseChecklist.ts RELEASE_CHECKLIST_ITEMS (auth, story.create, comfort, earn); Settings.tsx Link Open release checklist |
| create_story_no_cover_path | pass | CreateStory.tsx: cover optional; syncServerDraft uses cover_url || defaultStoryCoverUrl(); coverDefer UI; storyCover.ts DEFAULT_STORY_COVER_PATH; ChapterEditor publish blocks isMissingOrDefaultCover |
| telugu_input_path | pass | TeluguTextField.tsx phonetic+IME lang=te; CreateStory uses it for title/description/setting/themes; Profile.tsx bio/name fields use TeluguTextField |
| comfort_prefs_wired | pass | comfortPrefs.ts load/save + applyGlobalComfort (data-ui-scale/motion/contrast); main.tsx boot applyGlobalComfort(); Settings.tsx UI controls; ChapterEditor fontScale; comfort-system.css consumes attrs |
| theme_toggle_present | pass | ThemeContext.tsx toggleTheme/setTheme; ThemeToggle.tsx; mounted in AppTopNav, Login, Onboarding, EditorNavbar; Settings theme pref control |
| mock_mode_prod_guard | pass | lib/supabase.ts: export const isMockMode = import.meta.env.PROD ? false : (VITE_MOCK_MODE or placeholder config); ARC-02 comment hard-blocks mock in production builds |
| mobile_tab_bar | pass | Layout.tsx renders AppMobileTabBar; AppMobileTabBar maps NAV_PRIMARY (dashboard/stories/earn) + More sheet; navConfig.ts NAV_PRIMARY routes |
| error_boundaries | pass | App.tsx root <ErrorBoundary> wraps providers/router; ErrorBoundary.tsx class boundary with reload CTA; stack only in DEV |
| auth_login_page | pass | pages/Login.tsx export Login; Google + email OTP flows; OAuth code return handling; ThemeToggle; route /login outside ProtectedRoute |
| dashboard_entry | pass | App.tsx path="/" element={<Dashboard />}; Dashboard.tsx loads api.getDashboard, stories, milestones, persona widgets |
| earn_hub_entry | pass | App.tsx /earn → Earn with reviews (flag) + payouts children; Earn.tsx tab UI + Outlet; /reviewers and /monetization Navigate to earn hub |
| settings_entry | pass | App.tsx /settings → Settings.tsx; comfort prefs, theme, devices, payout profile, Link to /release-checklist |

## Visual / UX dimensions

### visual_communication

Visual communication is strongest where dedicated systems exist (Create Story bordered errors, empty-state v2 layout, labeled status badges). Hierarchy breaks across surfaces: gold vs maroon primary CTAs, weak color-only login errors, legal copy that understates a full Studio lock, silent phonetic fields, and incomplete Telugu coverage on Settings plus code-switched Telugu strings. Unify primary CTA tokens, strengthen auth/legal alerts, and make bilingual labels and input-mode affordances explicit.

### eye_comfort

Creation manuscript eye-comfort is mature (warm paper, deep ink, Telugu leading, calm-motion/high-contrast, comfortPrefs). Residual risk is management/hub pure-white and near-white editor preview chrome, washed sv21 muted text, Settings line-height mislabels, and no in-editor leading control—plus small nav chips and a non-senior default UI scale.

### css_consistency

Creator Studio has a real brand token core (brand-tokens → theme → comfort) but consistency is undermined by (1) mobile z-index above all shared modals, (2) undefined prototype tokens in nav-v2 with light fallbacks that break dark mobile, (3) a deep premium/cohesion cascade that patches rather than owns color, and (4) key surfaces (LegalConsentGate, Settings) living in inline styles while UI_CONFIG and CSS disagree on brand hex. Highest leverage: one z-index scale, one token language, collapse wave CSS, and move TSX inline styles into token-backed classes.

### ergonomics_a11y

Creator Studio has solid foundations (comfort-system contrast/motion, 52px mobile tab bar, Esc on key menus, editor shortcuts, many role=alert surfaces) but keyboard modal hygiene and touch/disabled-state communication lag: shared CmsModal and the mobile More sheet lack focus traps/initial focus; MediaInsertModal lacks Esc entirely; many chrome/editor icon controls sit at 32–34px; login errors are not field-associated; disabled primaries often show only reduced opacity without explaining why. Fixing a shared focus-trap modal primitive and a 44px control token would clear most major ergonomics_a11y debt.

## Confirmed findings (survived verification)

| ID | Severity | Area | File | Issue |
|---|---|---|---|---|
| vc-cta-primary-system-split | major | visual | `D:/Katha_Enterprise/MVP/creator-cms/src/styles/dashboard.css` | Primary actions use two competing systems: gold cream-on-gradient (.dashboard-cta / .katha-cta on Login and Settings) vs maroon white-on-solid (.sv21__cta on Dashboard, .cs-v21__continue-btn on Create Story). .btn-primary forces dark ink on gold while .dashboard-cta uses cream-on-gold, so users cannot learn a single main-action look. Dashboard load-error recovery also uses .sv21__cta--soft, demoting the only recovery action. |
| vc-legal-consent-scope-copy | major | ux | `D:/Katha_Enterprise/MVP/creator-cms/src/components/LegalConsentGate.tsx` | Tagline says Privacy and Creator Agreement are required before publishing on Katha, but the gate blocks the entire Studio Outlet until both checkboxes are accepted. Telugu CTA mixes scripts (Creator Studio). Version lines are always English. Error uses hard-coded #8B3A62 brand ember instead of the stronger bordered error treatment used on Create Story. |
| vc-auth-error-visibility | major | a11y | `D:/Katha_Enterprise/MVP/creator-cms/src/pages/Login.tsx` | Login errors render only as .cms-error-text.cms-auth-error (color ~#9a4a52, no background or border) and sit after all CTAs. OAuth/API failures are often English regardless of locale. Create Story uses .cs-v21__error with border, tinted background, weight 500, and assertive live region. |
| vc-settings-english-only | major | ux | `D:/Katha_Enterprise/MVP/creator-cms/src/pages/Settings.tsx` | Settings imports useLocale but major sections (payout readiness, legal name/UPI/PAN labels, comfort toggles, Labs, release checklist) are hard-coded English. With the nav locale toggle set to Telugu, this page breaks bilingual continuity and form-label clarity for Telugu creators. |
| vc-phonetic-no-field-affordance | major | ergonomics | `D:/Katha_Enterprise/MVP/creator-cms/src/pages/CreateStory.tsx` | Title, description, setting, and themes use TeluguTextField with phonetic enabled when locale or story language is te, with no adjacent label, chip, or hint that roman-to-Telugu conversion is live. Unlike ChapterEditor's phonetic toggle, Create Story can rewrite Latin keystrokes without explaining input mode. |
| vc-empty-state-title-te-duplicate | minor | visual | `D:/Katha_Enterprise/MVP/creator-cms/src/pages/Dashboard.tsx` | Empty shelf passes title and titleTe as the same t('stories.emptyShelfText') when locale is te. StudioEmptyState then renders the identical Telugu string twice, cluttering empty-state hierarchy. |
| vc-status-badge-brand-collision | minor | visual | `D:/Katha_Enterprise/MVP/creator-cms/src/styles/studio-v21.css` | .sv21__badge--review uses brand gold and --revision uses brand ember/maroon—the same palette as CTAs and nav active states—so status meaning leans on small 12px text. Draft and registered both use surface-1 with soft nuance that is easy to miss. app-nav-status Early stage is also muted chip chrome, not a distinct status language. |
| vc-te-code-switch-create-legal | minor | ux | `D:/Katha_Enterprise/MVP/creator-cms/src/pages/CreateStory.tsx` | Telugu format-guide flags and shared legal summaries mix Latin product jargon mid-sentence (Publish, Format Spec v1, soft targets, Story Trust, Performing/Apex, Creator Studio). Combined with always-English Version labels on LegalConsentGate, Telugu locale reads half-translated and weakens form and consent comprehension. |
| ec-mgmt-pure-white | major | comfort | `D:\Katha_Enterprise\MVP\packages\shared\brand-tokens.css` | Management mode and hub pages still use pure white surfaces (#ffffff for --katha-mode-surface / --sv21-surface) while Settings claims low-glare warm ivory; long dashboard/settings sessions keep higher glare than creation paper. |
| ec-preview-glare | major | visual | `D:\Katha_Enterprise\MVP\creator-cms\src\styles\editor-prototype.css` | Editor preview/reader cards hardcode near-white (#FFFCF7 and rgba(255,252,247,…) in editor-premium-v2.css) against the warm ivory manuscript canvas (#e8e0d0), causing a brightness jump when creators switch write↔preview. |

### Evidence & suggestions

#### vc-cta-primary-system-split

- **Issue:** Primary actions use two competing systems: gold cream-on-gradient (.dashboard-cta / .katha-cta on Login and Settings) vs maroon white-on-solid (.sv21__cta on Dashboard, .cs-v21__continue-btn on Create Story). .btn-primary forces dark ink on gold while .dashboard-cta uses cream-on-gold, so users cannot learn a single main-action look. Dashboard load-error recovery also uses .sv21__cta--soft, demoting the only recovery action.
- **Evidence:** .dashboard-cta,.katha-cta { background: linear-gradient(...gold...); color: var(--katha-cream, #fdf8f0) } (dashboard.css:628-643). .btn-primary { color: #1a1510; gold gradient } (components.css:13-17). .sv21__cta { background: var(--sv21-maroon); color: #fff } and .sv21__cta--soft { surface + maroon text } (studio-v21.css:92-113). .cs-v21__continue-btn { background: var(--cs-maroon); color: #fff } (cohesion-wave29.css:474-482). Dashboard.tsx:197 uses className="sv21__cta sv21__cta--soft" for tryAgain/signInAgain.
- **Suggestion:** Pick one primary (gold dark-ink for management/auth; maroon only for publish-critical). Map all page-level progress CTAs to that token; reserve soft/secondary for back/alternate. Use solid primary styling for empty-state and error recovery CTAs.

#### vc-legal-consent-scope-copy

- **Issue:** Tagline says Privacy and Creator Agreement are required before publishing on Katha, but the gate blocks the entire Studio Outlet until both checkboxes are accepted. Telugu CTA mixes scripts (Creator Studio). Version lines are always English. Error uses hard-coded #8B3A62 brand ember instead of the stronger bordered error treatment used on Create Story.
- **Evidence:** tagline L171–172 '…required before publishing on Katha' / Telugu 'ప్రచురణకు ముందు'; L156 if (!user || !needsConsent) return <Outlet />; else full-page gate; L239 'అంగీకరించి Creator Studioకి వెళ్ళండి'; L188/209 'Version {…}' always English; L222 style={{ color: '#8B3A62' }} vs CreateStory cs-v21__error.
- **Suggestion:** State that Studio access is locked until consent is recorded. Localize version labels; keep product naming consistent in Telugu. Style consent errors like .cs-v21__error (border, background, role=alert), not brand-ember text alone.

#### vc-auth-error-visibility

- **Issue:** Login errors render only as .cms-error-text.cms-auth-error (color ~#9a4a52, no background or border) and sit after all CTAs. OAuth/API failures are often English regardless of locale. Create Story uses .cs-v21__error with border, tinted background, weight 500, and assertive live region.
- **Evidence:** Login.tsx L277: `{error && <p className="cms-error-text cms-auth-error" role="alert">{error}</p>}` after choose/email/otp CTAs; L58/94/109/124/139 English fallbacks + L26-28 oauthError from URL; dashboard.css `.cms-error-text{color:var(--katha-error,#9a4a52)}`; studio.css `.cms-auth-error` margin/center only; CreateStory `.cs-v21__error` + cohesion-wave29.css border/bg/font-weight:500; aria-live="assertive".
- **Suggestion:** Place a single alert region above primary actions; use bordered error surface tokens; localize auth failure strings; keep role=alert and scroll into view when an error is set.

#### vc-settings-english-only

- **Issue:** Settings imports useLocale but major sections (payout readiness, legal name/UPI/PAN labels, comfort toggles, Labs, release checklist) are hard-coded English. With the nav locale toggle set to Telugu, this page breaks bilingual continuity and form-label clarity for Telugu creators.
- **Evidence:** Lines 32–35: useLocale + const { t } = useLocale(); only t() uses at 152–155 for header. Hard-coded: L178 "Payout readiness"; L187 "Legal name (as on UPI / PAN)"; L197 "UPI ID"; L207 "PAN / tax ID..."; L252 "Release checklist"; L269 "Studio Labs"; L340/348 comfort toggles; L357 "Writing comfort (editor)".
- **Suggestion:** Route all Settings labels, hints, and status messages through studioLocale keys (en/te), matching Login/Dashboard patterns; keep UPI/PAN placeholders Latin with Telugu labels.

#### vc-phonetic-no-field-affordance

- **Issue:** Title, description, setting, and themes use TeluguTextField with phonetic enabled when locale or story language is te, with no adjacent label, chip, or hint that roman-to-Telugu conversion is live. Unlike ChapterEditor's phonetic toggle, Create Story can rewrite Latin keystrokes without explaining input mode.
- **Evidence:** CreateStory.tsx:280 `const useTeluguPhonetic = locale === 'te' || language === 'te';` then title/description/setting/themes all pass `phonetic={useTeluguPhonetic}` (e.g. 375–385, 394–404, 604–612, 616–624) with labels only like t('createStory.storyTitle')—no phonetic copy. TeluguTextField.tsx:22–23/90–97 live roman→Telugu when phonetic; returns only <input>/<textarea>. NarrativeInspectorPanel.tsx:145–153 has `Phonetic input` On/Off toggle.
- **Suggestion:** Add a compact field affordance (for example Phonetic on: type amma becomes Telugu) and/or a toggle near the first Telugu field; clarify behavior when UI language is English but content language is Telugu.

#### vc-empty-state-title-te-duplicate

- **Issue:** Empty shelf passes title and titleTe as the same t('stories.emptyShelfText') when locale is te. StudioEmptyState then renders the identical Telugu string twice, cluttering empty-state hierarchy.
- **Evidence:** Dashboard.tsx:294-295 title={t('stories.emptyShelfText')} titleTe={locale === 'te' ? t('stories.emptyShelfText') : undefined}; StudioEmptyState.tsx:40-42 <Heading className="studio-empty__title">{title}</Heading> then {titleTe && <p className="studio-empty__title-te ...">{titleTe}</p>}
- **Suggestion:** When locale is te, pass only title (or only titleTe). Use titleTe only as a secondary gloss when the primary title is English.

#### vc-status-badge-brand-collision

- **Issue:** .sv21__badge--review uses brand gold and --revision uses brand ember/maroon—the same palette as CTAs and nav active states—so status meaning leans on small 12px text. Draft and registered both use surface-1 with soft nuance that is easy to miss. app-nav-status Early stage is also muted chip chrome, not a distinct status language.
- **Evidence:** .sv21__badge { font-size: 12px; ... } .sv21__badge--draft { background: var(--sv21-surface-1); color: var(--sv21-ink-soft); } .sv21__badge--review { background: var(--sv21-gold-light); color: var(--sv21-gold); } .sv21__badge--revision { background: color-mix(... var(--katha-ember, #8B3A62) 14% ...); color: var(--katha-ember, #8B3A62); } .sv21__badge--registered { background: var(--sv21-surface-1); color: var(--sv21-maroon); } + .sv21__cta { background: var(--sv21-maroon); }
- **Suggestion:** Give workflow statuses non-brand hues (sage published, amber review, rose revision, neutral draft) plus optional icons; reserve gold/maroon for brand chrome and primary CTAs.

#### vc-te-code-switch-create-legal

- **Issue:** Telugu format-guide flags and shared legal summaries mix Latin product jargon mid-sentence (Publish, Format Spec v1, soft targets, Story Trust, Performing/Apex, Creator Studio). Combined with always-English Version labels on LegalConsentGate, Telugu locale reads half-translated and weakens form and consent comprehension.
- **Evidence:** CreateStory.tsx TE flags: 'Publishకు నియమం కాదు.' and 'Format Spec v1 ... Soft targets publishను block చేయవు (hard max ...)'; LegalConsentGate always shows 'Version {DPDP_PRIVACY_VERSION}' / 'Version {CREATOR_AGREEMENT_VERSION}' with no te branch; TE CTA 'Creator Studioకి'; CREATOR_AGREEMENT_SUMMARY_TE keeps 'Story Trust'/'Performing'/'Apex'.
- **Suggestion:** Prefer full Telugu phrasing with a single Latin proper noun only where unavoidable; provide Telugu glosses for product terms; localize structural chrome such as Version.

#### ec-mgmt-pure-white

- **Issue:** Management mode and hub pages still use pure white surfaces (#ffffff for --katha-mode-surface / --sv21-surface) while Settings claims low-glare warm ivory; long dashboard/settings sessions keep higher glare than creation paper.
- **Evidence:** brand-tokens.css L81–86: Management Mode — Dashboard, Stories, Analytics, Settings with --katha-mode-surface: #ffffff; L96–103: Creation Mode — Chapter Editor (low-glare paper) / Target warm ivory with --katha-mode-surface: #e6ddcc
- **Suggestion:** Align management/hub surfaces to warm paper tokens (e.g. #f7f2e8 / #f5f0e8) everywhere var(--surface)/sv21-surface is used; stop defaulting mode surface to #ffffff.

#### ec-preview-glare

- **Issue:** Editor preview/reader cards hardcode near-white (#FFFCF7 and rgba(255,252,247,…) in editor-premium-v2.css) against the warm ivory manuscript canvas (#e8e0d0), causing a brightness jump when creators switch write↔preview.
- **Evidence:** .katha-proto-reader-card { background: #FFFCF7; } (editor-prototype.css ~2091); .katha-proto-layout--premium .katha-proto-preview { background: rgba(255, 252, 247, 0.96); } and .katha-proto-preview-body uses rgba(255, 252, 247, 0.98) (editor-premium-v2.css ~211–244); write canvas: .katha-proto-editor-canvas { background: var(--editor-canvas); } with [data-katha-mode='creation'] --katha-mode-canvas: #e8e0d0 (brand-tokens.css / theme.css).
- **Suggestion:** Retarget .katha-proto-reader-card, premium preview panes, and leftover near-white chrome to var(--editor-canvas) / paper tokens; extend editor-eye-comfort.css selectors to cover preview surfaces.

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
