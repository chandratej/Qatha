/**
 * Versioning module composition root.
 */

import { isMockMode } from '../lib/mockMode.js';
import { supabase } from '../lib/supabase.js';
import { createMemoryVersionStorage } from './infrastructure/MemoryVersionStorage.js';
import { createDocumentVersionStorage } from './infrastructure/DocumentVersionStorage.js';
import { createVersionService } from './application/VersionService.js';
import { DEFAULT_CHECKPOINT_RULES } from './domain/types.js';

let _service = null;
const sharedMemory = createMemoryVersionStorage();

export function getVersionService() {
  if (_service) return _service;

  const storage = createDocumentVersionStorage({
    supabase: isMockMode() ? null : supabase,
    memoryFallback: sharedMemory,
  });

  _service = createVersionService({
    storage,
    rules: DEFAULT_CHECKPOINT_RULES,
  });
  return _service;
}

/** Reset for tests */
export function __resetVersionServiceForTests() {
  _service = null;
}

export { createVersionService } from './application/VersionService.js';
export { createMemoryVersionStorage } from './infrastructure/MemoryVersionStorage.js';
export { createDocumentVersionStorage } from './infrastructure/DocumentVersionStorage.js';
