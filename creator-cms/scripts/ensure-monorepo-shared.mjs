/**
 * Imports use ../../../packages/shared (monorepo root).
 * - Monorepo / Vercel root = repo: path already exists.
 * - Isolated creator-cms root: copy vendored creator-cms/packages/shared
 *   up to ../packages/shared when parent is writable; else fail with instructions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsRoot = path.resolve(__dirname, '..');
const monorepoShared = path.resolve(cmsRoot, '..', 'packages', 'shared');
const localShared = path.resolve(cmsRoot, 'packages', 'shared');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

if (fs.existsSync(monorepoShared)) {
  console.log('[ensure-shared] monorepo packages/shared present — OK');
  process.exit(0);
}

if (fs.existsSync(localShared)) {
  try {
    const parentPackages = path.resolve(cmsRoot, '..', 'packages');
    fs.mkdirSync(parentPackages, { recursive: true });
    copyDir(localShared, monorepoShared);
    console.log('[ensure-shared] mirrored vendored shared →', monorepoShared);
    process.exit(0);
  } catch (err) {
    console.error('[ensure-shared] could not write monorepo path:', err?.message || err);
  }
}

console.error('[ensure-shared] FATAL: cannot resolve packages/shared for build');
console.error('  expected monorepo:', monorepoShared);
console.error('  expected vendor:', localShared);
console.error('Deploy from monorepo root (vercel.json / vercel.cms.json), not creator-cms alone.');
process.exit(1);
