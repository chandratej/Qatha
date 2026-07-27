# External Data Safety (Standing Rule)

**Source:** `Worklog/27_JUL_2026/Katha_Master_Workflow_Implementation_Prompt.md` Part 2.2 + Part 3  
**Effective:** immediately and permanently  
**Owner:** Founder + Engineering  

## Standing rule

> **No external AI tool (Grok, Claude, ChatGPT, etc.) ever receives a raw production database row containing PII, payment/payout details, or re-identifiable user content.**

It **may** receive:

- Schema definitions / migrations / RLS policies (structure only)
- Masked or aggregated views under the `external_safe` schema
- Synthetic / seed data (`MOCK_MODE=true`, seed stories)
- Application source code (to help write or debug)

It **must not** receive:

- Raw `creators` / `profiles` rows with email, phone, legal name, UPI, PAN, bank details
- Per-creator exact payouts joined to identity
- Reader identities, contact lists, device IDs, reading progress of named users
- Automated pipelines that pipe production query results into an external LLM API
- Founder funnel JSON with emails or other contact fields (use default redacted export only)

## Why this exists

Even after enterprise Zero Data Retention agreements, Privacy Policy processor disclosure, and RBI PA confirmation, this rule stays until it is **deliberately re-evaluated in writing**. Until then: no “just this once” exceptions.

## Implementation

| Piece | Location |
|-------|----------|
| Schema | `external_safe` (migration `047_external_safe_schema.sql`) |
| Manual apply | `supabase/apply_manual/06_047_external_safe.sql` |
| Views | `external_safe.creators_masked`, `earnings_summary`, `content_stats` |
| Role | `external_export_ro` — **NOLOGIN**, SELECT on `external_safe` only |
| Workflow | `/katha-external-data-safety` |
| Funnel script | `backend/scripts/founder-writer-funnel.mjs` — emails redacted unless `--include-pii` |

### Bootstrap note

`supabase/bootstrap_all.sql` is a historical combined dump through early migrations (**does not include 047**). For new environments:

1. Prefer running ordered files under `supabase/migrations/`.
2. Or paste `supabase/apply_manual/06_047_external_safe.sql` in the Supabase SQL Editor after core schema exists.
3. Do **not** assume `bootstrap_all.sql` alone yields an external-LLM-safe export surface.

### Role usage (`external_export_ro` is NOLOGIN)

`external_export_ro` is a **privilege container**, not a login user:

```sql
-- One-time: grant the privilege role to a human login role (optional)
GRANT external_export_ro TO your_dashboard_login_role;

-- Typical founder path: Supabase SQL Editor as postgres/service role
SELECT * FROM external_safe.creators_masked LIMIT 50;
SELECT * FROM external_safe.earnings_summary;
SELECT * FROM external_safe.content_stats LIMIT 50;
```

- **NOLOGIN** prevents anyone from authenticating *as* `external_export_ro` with a password and automating dumps.
- Schema and views revoke `PUBLIC` / `anon` / `authenticated` so PostgREST clients cannot read them by default.
- Never store a long-lived password role whose only job is “export prod for ChatGPT.”

### View public-forum test

Before adding any new view to `external_safe`, answer:

> *If this view were pasted into a public forum, would any real person’s identity, contact info, or financial detail be exposed?*

If **yes**, do not ship it.

**Current view hygiene:**

| View | Safe contents | Explicitly excluded |
|------|---------------|---------------------|
| `creators_masked` | id, pen_name, created_at, story/chapter/reader aggregates | email, phone, legal, UPI, PAN, `is_banned` |
| `earnings_summary` | monthly totals only | creator_id, bank/UPI |
| `content_stats` | **published** titles + aggregates | unpublished/draft titles, reader IDs |

## How to use with Grok / Claude (human in the loop)

1. Engineer runs a **manual** `SELECT` against `external_safe.*` (or uses seed/mock data).
2. Human reviews the export (CSV/snippet) for accidental PII.
3. Only then may the snippet be pasted into an external AI session for analysis.
4. **Never** wire an automated job that posts prod rows to an external LLM endpoint.
5. For writer funnel metrics: `npm run founder:funnel` (redacted). Do **not** pass `--include-pii` output to an external LLM.

## Related workflows

| Workflow | Purpose |
|----------|---------|
| `/katha-external-data-safety` | Audit / implement this layer |
| `/katha-weekly-triage` | Weekly router (does not export data) |
| `/katha-ops-verification` | Ops checks without dumping PII |

## Re-evaluation criteria (all three required)

1. Enterprise API agreement with Zero Data Retention signed  
2. Privacy Policy updated to disclose the processor  
3. RBI PA determination confirmed in writing by counsel  

Then: deliberate written decision to relax or keep this rule — not silent lapse.
