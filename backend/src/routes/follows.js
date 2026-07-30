import { Router } from 'express';
import { createAppError } from '../middleware/errorHandler.js';
import { getAuthenticatedUserId } from '../middleware/authenticate.js';
import {
  followAuthor,
  unfollowAuthor,
  listAuthorFollowers,
  listFollowing,
  isFollowing,
} from '../services/authorFollowStore.js';

export const followsRouter = Router();

/** POST /api/follows/:authorId — follow a creator */
followsRouter.post('/:authorId', async (req, res, next) => {
  try {
    const followerId = getAuthenticatedUserId(req);
    const authorId = req.params.authorId;
    const result = await followAuthor(followerId, authorId);
    res.status(201).json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** DELETE /api/follows/:authorId — unfollow */
followsRouter.delete('/:authorId', async (req, res, next) => {
  try {
    const followerId = getAuthenticatedUserId(req);
    const result = await unfollowAuthor(followerId, req.params.authorId);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** GET /api/follows/me/following */
followsRouter.get('/me/following', async (req, res, next) => {
  try {
    const followerId = getAuthenticatedUserId(req);
    const result = await listFollowing(followerId);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** GET /api/follows/authors/:authorId/readers — creators see who follows them */
followsRouter.get('/authors/:authorId/readers', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const authorId = req.params.authorId;
    if (userId !== authorId) {
      // Allow creators to only see their own reader list
      return next(createAppError('FORBIDDEN', 'Not your reader list', 403));
    }
    const result = await listAuthorFollowers(authorId);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** GET /api/follows/authors/:authorId/status — am I following? */
followsRouter.get('/authors/:authorId/status', async (req, res, next) => {
  try {
    const followerId = getAuthenticatedUserId(req);
    const following = await isFollowing(followerId, req.params.authorId);
    res.json({ following, author_id: req.params.authorId });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});
