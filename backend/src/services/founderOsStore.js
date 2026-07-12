/**
 * Founder OS — feature flags & idea backlog for founder review.
 * Reads MVP/founder-os/*.json (config + ideas).
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FOUNDER_OS_DIR = join(__dirname, '../../../founder-os');

function readJson(name) {
  try {
    const raw = readFileSync(join(FOUNDER_OS_DIR, name), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getFounderOsConfig() {
  return readJson('config.json') ?? { version: 0, features: {} };
}

export function getFounderOsIdeas() {
  return readJson('ideas.json') ?? { version: 0, ideas: [] };
}

export function isFeatureEnabled(featureId) {
  const config = getFounderOsConfig();
  return Boolean(config.features?.[featureId]?.enabled);
}