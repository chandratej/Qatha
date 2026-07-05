import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { createAppError } from '../middleware/errorHandler.js';

export const uploadRouter = Router();

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

uploadRouter.post('/', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'];
    if (!creatorId) throw createAppError('OTP_REQUIRED', 'Authentication required', 401);

    const { image_base64, filename, content_type } = req.body;
    if (!image_base64) throw createAppError('INTERNAL_ERROR', 'image_base64 is required', 400);

    const mime = content_type || 'image/jpeg';
    if (!ALLOWED_TYPES.has(mime)) {
      throw createAppError('INTERNAL_ERROR', 'Only JPEG, PNG, and WebP images are allowed', 400);
    }

    const buffer = Buffer.from(image_base64, 'base64');
    if (buffer.length > MAX_BYTES) {
      throw createAppError('INTERNAL_ERROR', 'Image must be under 5MB', 400);
    }

    if (isMockMode()) {
      const dataUrl = `data:${mime};base64,${image_base64}`;
      return res.json({ url: dataUrl, mock: true });
    }

    const sb = getSupabase();
    if (!sb) throw createAppError('INTERNAL_ERROR', 'Storage not configured', 503);

    const ext = (filename?.split('.').pop() || mime.split('/')[1] || 'jpg').toLowerCase();
    const path = `${creatorId}/${Date.now()}.${ext}`;

    const { error } = await sb.storage
      .from('story-covers')
      .upload(path, buffer, { contentType: mime, upsert: true });

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);

    const { data: publicUrl } = sb.storage.from('story-covers').getPublicUrl(path);
    res.json({ url: publicUrl.publicUrl });
  } catch (err) {
    next(err);
  }
});