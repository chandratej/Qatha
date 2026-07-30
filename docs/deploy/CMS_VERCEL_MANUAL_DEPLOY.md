# Creator CMS — manual / stable Vercel deploys

## Goal

**Production (`https://katha-creator-cms.vercel.app`) updates only when you decide.**  
Git pushes to `main` must **not** auto-promote production.

This is intentional for Katha MVP: ship a known-good tree after smoke checks, not every WIP commit.

## Current setup (as of 2026-07)

| Item | Value |
|------|--------|
| Vercel project | `qatha/katha-creator-cms` |
| Link file | monorepo root `.vercel/project.json` |
| Config | root `vercel.json` (build CMS from monorepo) |
| Git auto-deploy | **Off** — deploys are CLI uploads (no `gitSource` on production deployments) |
| Production URL | https://katha-creator-cms.vercel.app |

Root `vercel.json`:

```json
{
  "installCommand": "cd creator-cms && npm ci",
  "buildCommand": "cd creator-cms && npm run build",
  "outputDirectory": "creator-cms/dist"
}
```

Always deploy from the **monorepo root** so `packages/shared` resolves.

## How to ship a stable build

### Recommended one-liner

```powershell
# From repo root (D:\Katha_Enterprise\MVP)
.\scripts\deploy-cms-prod.ps1
```

Optional flags:

```powershell
.\scripts\deploy-cms-prod.ps1 -Yes              # skip typing "deploy"
.\scripts\deploy-cms-prod.ps1 -BuildLocal       # npm run build in creator-cms first
.\scripts\deploy-cms-prod.ps1 -RequireClean     # refuse if uncommitted changes
.\scripts\deploy-cms-prod.ps1 -Preview          # preview URL only (not production)
```

### Equivalent raw CLI

```powershell
cd D:\Katha_Enterprise\MVP
npx vercel whoami
npx vercel deploy --prod --yes
```

### After deploy

1. Hard-refresh the browser: **Ctrl+Shift+R** (hashed CSS can stick).
2. Optional smoke: `.\scripts\verify-mode-b-smoke.ps1`

## Keep production manual (do not “fix” auto-deploy)

### Option A — Leave Git disconnected (simplest)

- Vercel → **katha-creator-cms** → **Settings → Git**
- **Do not** connect the GitHub repo for this project, **or** disconnect if connected.
- Only CLI / script deploys update production.

### Option B — Connect Git for previews only (advanced)

If you want PR preview URLs but not production on every push:

1. Connect `chandratej/Qatha`.
2. Set **Production Branch** carefully (or avoid promoting every `main` commit).
3. Prefer **Promote** a preview to production only when stable, **or** keep using  
   `.\scripts\deploy-cms-prod.ps1` for production and treat Git builds as non-prod.

Dashboard build settings, if used, must match monorepo root:

| Setting | Value |
|---------|--------|
| Root Directory | `.` (empty / monorepo root) |
| Install | `cd creator-cms && npm ci` |
| Build | `cd creator-cms && npm run build` |
| Output | `creator-cms/dist` |

**Wrong:** Root Directory = `creator-cms` with dashboard `npm run build` / `dist` only — can miss monorepo `packages/shared` unless the ensure-shared mirror runs.

## What not to do

- Expect `git push origin main` alone to update Creator Studio production.
- Deploy from `creator-cms/` alone without the monorepo `vercel.json` path (prefer repo root + root config).
- Connect Git and leave Production Branch = `main` with auto-deploy if you want **only** manual stables.

## Checklist before a “stable” prod push

- [ ] Local smoke of the screens you care about (editor, refine preview, dark theme)
- [ ] `git status` clean *or* you knowingly ship dirty tree (CLI uploads working files)
- [ ] Commit + tag if you want a named release (`git tag cms-stable-YYYYMMDD`)
- [ ] `.\scripts\deploy-cms-prod.ps1 -RequireClean -BuildLocal` (optional hard gate)
- [ ] Hard-refresh production + spot-check

## Related

- API (Render): `.\scripts\deploy-render-api.ps1`
- Smoke: `.\scripts\verify-mode-b-smoke.ps1`
- Dry run: `.\scripts\production-dry-run.ps1`
