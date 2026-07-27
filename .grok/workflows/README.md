# Katha Master Workflows (Grok Build)

Grounded in `Worklog/27_JUL_2026/Katha_Master_Workflow_Implementation_Prompt.md`.

| Command | Purpose | Part | Typical args |
|---------|---------|------|----------------|
| `/katha-master-router` | Entry: pick branch | — | `{ "intent": "weekly" }` |
| `/katha-weekly-triage` | 6-question weekly router | 1.1 | `{ "threshold_event": false, "month_or_quarter_start": false, "feature_over_one_week": false }` |
| `/katha-monthly-foundations` | Monthly foundations + security | 1.3 / 4.2 | `{}` |
| `/katha-feature-decision` | Unified feature scorecard draft | 1.4 / 4.1 | `{ "feature": "name", "context": "optional" }` |
| `/katha-identity-spoof-verify` | Verify x-creator-id closed | 2.1 | `{ "fix_mode": "fix" }` |
| `/katha-external-data-safety` | external_safe + standing rule | 2.2 / 3 | `{ "fix_mode": "fix" }` |
| `/katha-ops-verification` | Migrations / dry-run / tests | 2.3 | `{}` |
| `/mvp1-product-workflow-audit` | Creator→reader path audit | MVP1 eng | `{ "fix_mode": "fix" }` |

## Intent values for master router

`weekly` · `monthly` · `feature` · `identity` · `data_safety` · `ops` · `threshold` · `mvp1_audit`

## Engineering companions (repo, not Rhai)

| Deliverable | Path |
|-------------|------|
| external_safe schema | `supabase/migrations/047_external_safe_schema.sql` |
| external_safe manual apply | `supabase/apply_manual/06_047_external_safe.sql` |
| Standing rule doc | `EXTERNAL_DATA_SAFETY.md` |
| Funnel (redacted default) | `backend/scripts/founder-writer-funnel.mjs` |
| Identity forge tests | `backend/src/middleware/authenticate.test.js` (6/6 passing) |
| Peer-review author scope | `backend/src/routes/platform.js` + `platformAuthorScope.test.js` |

## Smoke checks

Each workflow was smoke-checked with `validate_only: true` (metadata + compile + one canned path). That does **not** exercise live tools or every branch — run a real pass after deploy/ops changes.

## Agent budget guide

| Workflow | Approx agents |
|----------|---------------|
| master-router | 0–1 |
| weekly-triage | 1 |
| monthly-foundations | 2 |
| feature-decision | 2 |
| identity-spoof-verify | 2–3 |
| external-data-safety | 1–2 |
| ops-verification | 2 |
| mvp1-product-workflow-audit | ≤25 (capped) |
