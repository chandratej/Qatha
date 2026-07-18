/**
 * REST API for Story Versioning domain.
 * Business terminology only — no storage/tech leakage.
 */

import { Router } from 'express';
import { requireAuth, getAuthenticatedUserId } from '../../middleware/authenticate.js';
import { createAppError } from '../../middleware/errorHandler.js';
import { getVersionService } from '../index.js';

export const versionsRouter = Router();

versionsRouter.use(requireAuth());

/**
 * POST /api/versions
 * CreateVersion / CreateAutoCheckpoint / Manual / Publish / Draft
 * body: { story_id, chapter_id?, version_type, version_name?, content, force? }
 */
versionsRouter.post('/', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const {
      story_id: storyId,
      chapter_id: chapterId,
      version_type: versionType = 'Manual',
      version_name: versionName,
      content,
      force = false,
    } = req.body || {};

    if (!storyId || !content) {
      throw createAppError('BAD_REQUEST', 'story_id and content are required', 400);
    }

    const service = getVersionService();
    const input = {
      storyId,
      chapterId: chapterId != null ? String(chapterId) : null,
      createdBy: userId,
      content,
      versionName,
      force,
    };

    let version;
    if (versionType === 'AutoCheckpoint') {
      const result = await service.createAutoCheckpoint(input);
      return res.status(result.skipped ? 200 : 201).json({
        skipped: result.skipped,
        reason: result.reason,
        version: result.version ? publicVersion(result.version) : null,
      });
    }
    if (versionType === 'Publish') {
      version = await service.createPublishVersion(input);
    } else if (versionType === 'Draft') {
      version = await service.createDraftVersion(input);
    } else {
      version = await service.createManualVersion(input);
    }

    res.status(201).json({ version: publicVersion(version) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/versions?story_id=&chapter_id=&limit=&offset=
 */
versionsRouter.get('/', async (req, res, next) => {
  try {
    const storyId = req.query.story_id;
    if (!storyId) throw createAppError('BAD_REQUEST', 'story_id is required', 400);
    const service = getVersionService();
    const result = await service.listVersions({
      storyId: String(storyId),
      chapterId: req.query.chapter_id != null ? String(req.query.chapter_id) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      offset: req.query.offset ? Number(req.query.offset) : 0,
      versionType: req.query.version_type || undefined,
    });
    res.json({
      versions: result.items.map(publicVersion),
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/versions/timeline?story_id=&chapter_id=
 */
versionsRouter.get('/timeline', async (req, res, next) => {
  try {
    const storyId = req.query.story_id;
    if (!storyId) throw createAppError('BAD_REQUEST', 'story_id is required', 400);
    const service = getVersionService();
    const timeline = await service.getTimeline(
      String(storyId),
      req.query.chapter_id != null ? String(req.query.chapter_id) : null,
      req.query.limit ? Number(req.query.limit) : 50,
      req.query.offset ? Number(req.query.offset) : 0,
    );
    res.json({ timeline });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/versions/:versionId
 */
versionsRouter.get('/:versionId', async (req, res, next) => {
  try {
    const service = getVersionService();
    const version = await service.getVersion(req.params.versionId);
    if (!version) throw createAppError('NOT_FOUND', 'Version not found', 404);
    res.json({ version: publicVersion(version) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/versions/:versionId/restore
 * Creates a new version — never mutates history.
 */
versionsRouter.post('/:versionId/restore', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const service = getVersionService();
    const version = await service.restoreVersion({
      versionId: req.params.versionId,
      createdBy: userId,
      versionName: req.body?.version_name,
    });
    res.status(201).json({ version: publicVersion(version) });
  } catch (err) {
    if (err.code === 'NOT_FOUND' || err.status === 404) {
      return next(createAppError('NOT_FOUND', 'Version not found', 404));
    }
    next(err);
  }
});

/**
 * DELETE /api/versions/:versionId — archives (soft)
 */
versionsRouter.delete('/:versionId', async (req, res, next) => {
  try {
    const service = getVersionService();
    const ok = await service.deleteVersion(req.params.versionId);
    if (!ok) throw createAppError('NOT_FOUND', 'Version not found', 404);
    res.json({ archived: true });
  } catch (err) {
    next(err);
  }
});

function publicVersion(snapshot) {
  if (!snapshot) return null;
  return {
    id: snapshot.metadata.id,
    story_id: snapshot.metadata.storyId,
    chapter_id: snapshot.metadata.chapterId,
    version_number: snapshot.metadata.versionNumber,
    version_name: snapshot.metadata.versionName,
    created_by: snapshot.metadata.createdBy,
    created_at: snapshot.metadata.createdAt,
    version_type: snapshot.metadata.versionType,
    status: snapshot.metadata.status,
    restored_from_id: snapshot.metadata.restoredFromId ?? null,
    word_count: snapshot.metadata.wordCount ?? 0,
    content: snapshot.content,
  };
}
