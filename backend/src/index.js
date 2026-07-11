import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

import { authRouter } from './routes/auth.js';
import { storiesRouter } from './routes/stories.js';
import { chaptersRouter } from './routes/chapters.js';
import { creatorsRouter } from './routes/creators.js';
import { subscriptionsRouter } from './routes/subscriptions.js';
import { moderationRouter } from './routes/moderation.js';
import { analyticsRouter } from './routes/analytics.js';
import { waitlistRouter } from './routes/waitlist.js';
import { configRouter } from './routes/config.js';
import { engagementRouter } from './routes/engagement.js';
import { uploadRouter } from './routes/upload.js';
import { eventsRouter } from './routes/events.js';
import { platformRouter } from './routes/platform.js';
import { getLaunchOfferConfig } from './services/launchOffer.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/authenticate.js';
import { scheduleNotifications } from './services/notifications.js';
import { isMockMode } from './lib/mockMode.js';
import { deprecationHeaders } from './middleware/deprecation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001,http://127.0.0.1:3001').split(',');

app.use(helmet());
app.use(compression()); // Gzip/Brotli for all responses - big win for chapter text
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(deprecationHeaders());

app.get('/api/openapi.json', (_, res) => {
  import('./openapi.js').then(({ openApiSpec }) => res.json(openApiSpec));
});

app.get('/api/docs', (_, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html><head><title>Katha API Docs</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head><body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({ url: '/api/openapi.json', dom_id: '#swagger-ui' });</script>
</body></html>`);
});

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'katha-api',
    version: '1.0.0',
    mock_mode: isMockMode(),
    launch_offer: getLaunchOfferConfig(),
  });
});

/** Ops: SPI batch stats (no secrets). Full recompute requires SPI_BATCH_SECRET header if set. */
app.get('/api/ops/spi-stats', async (_, res) => {
  try {
    const { spiBatchStats } = await import('./services/storyTrustBatch.js');
    res.json(await spiBatchStats());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ops/spi-recompute', async (req, res) => {
  const secret = process.env.SPI_BATCH_SECRET;
  if (secret && req.headers['x-spi-batch-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { recomputeAllStoryTrust } = await import('./services/storyTrustBatch.js');
    const limit = Math.min(Number(req.body?.limit) || 50, 200);
    const result = await recomputeAllStoryTrust({
      limit,
      onlyStale: req.body?.only_stale !== false,
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/creators', requireAuth(), creatorsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/moderation', requireAuth(), moderationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/config', configRouter);
app.use('/api/engagement', engagementRouter);
app.use('/api/upload', requireAuth(), uploadRouter);
app.use('/api/events', eventsRouter);
app.use('/api/platform', platformRouter);

app.use(express.static(path.join(__dirname, '../../landing')));

app.use(errorHandler);

scheduleNotifications(cron);

app.listen(PORT, () => {
  const offer = getLaunchOfferConfig();
  console.log(`Katha API running on http://localhost:${PORT}`);
  console.log(`Landing page: http://localhost:${PORT}/`);
  console.log(`Launch offer: ${offer.mode} (trial ${offer.trial_days}d, gate Ch${offer.subscription_gate_chapter})`);
  if (isMockMode()) console.log('MOCK_MODE enabled — seed data + OTP 123456');
});