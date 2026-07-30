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
import { shareRouter } from './routes/share.js';
import { getLaunchOfferConfig } from './services/launchOffer.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth, requireCreatorConsent } from './middleware/authenticate.js';
import { scheduleNotifications } from './services/notifications.js';
import { isMockMode } from './lib/mockMode.js';
import { deprecationHeaders } from './middleware/deprecation.js';
import { versionsRouter } from './versioning/routes/versions.js';
import { followsRouter } from './routes/follows.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001,http://127.0.0.1:3001,http://localhost:8080,http://127.0.0.1:8080').split(',').map((s) => s.trim()).filter(Boolean);

/** Flutter web uses random localhost ports (e.g. :51786). CMS uses Vite :5173. */
function isDevLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin || '');
}

/** Vercel preview/production hosts for Creator Studio + Gateway (Mode B). */
function isVercelOrigin(origin) {
  return /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin || '');
}

// CORS must run before helmet / routes so preflight and error responses get ACAO.
// When the API is down, browsers also report "CORS" — keep this process stable (see bottom).
app.use(cors({
  origin(origin, callback) {
    // Non-browser clients (curl, mobile) send no Origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || isDevLocalOrigin(origin) || isVercelOrigin(origin)) {
      return callback(null, true);
    }
    // Reflect unknown origins in non-production so misconfigured previews still work
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  // Reflect any requested headers (Flutter sends x-device-id, x-user-id, etc.)
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-User-Id',
    'X-Subscription-Status',
    'X-Trial-Ends-At',
    'X-Device-Id',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Type'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
}));

// Allow cross-origin reads from Flutter web (default helmet CORP is same-origin).
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression()); // Gzip/Brotli for all responses - big win for chapter text
// Capture raw body for Razorpay webhook HMAC (JSON.stringify of parsed body breaks signatures)
app.use(express.json({
  limit: '2mb',
  verify: (req, _res, buf) => {
    if (buf?.length) {
      req.rawBody = buf.toString('utf8');
    }
  },
}));
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

function healthPayload() {
  const paymentsReady = Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
  const webhookReady = Boolean(
    process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET,
  );
  return {
    status: 'ok',
    service: 'katha-api',
    version: '1.0.0',
    mock_mode: isMockMode(),
    node_env: process.env.NODE_ENV || 'development',
    payments_ready: paymentsReady,
    webhook_secret_configured: webhookReady,
    spi_batch_secret_required: process.env.NODE_ENV === 'production',
    launch_offer: getLaunchOfferConfig(),
  };
}

app.get('/health', (_, res) => {
  res.json(healthPayload());
});

// Reader / CMS diagnostics — same payload under /api
app.get('/api/health', (_, res) => {
  res.json(healthPayload());
});

/** Ops: SPI batch stats (no secrets). Full recompute requires SPI_BATCH_SECRET. */
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
  // P1-13: always require secret in production; never open recompute when unset
  if (process.env.NODE_ENV === 'production') {
    if (!secret || req.headers['x-spi-batch-secret'] !== secret) {
      return res.status(401).json({ error: 'Unauthorized — SPI_BATCH_SECRET required' });
    }
  } else if (secret && req.headers['x-spi-batch-secret'] !== secret) {
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
app.use('/api/creators', requireAuth(), requireCreatorConsent(), creatorsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
// Copyright claim POST is public (rights holders are not logged-in readers) — P1-05.
// Mount before the auth-gated moderation router so /copyright-claims is reachable.
app.use('/api/moderation', moderationRouter);
// Role-gated admin moderation still requires auth inside route handlers.
app.use('/api/analytics', analyticsRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/config', configRouter);
app.use('/api/engagement', engagementRouter);
app.use('/api/upload', requireAuth(), requireCreatorConsent(), uploadRouter);
app.use('/api/events', eventsRouter);
app.use('/api/platform', platformRouter);
app.use('/api/versions', versionsRouter);
app.use('/api/follows', requireAuth(), followsRouter);
/** Public, unauthenticated — WhatsApp/Telegram link-preview crawlers hit this directly. */
app.use('/s', shareRouter);

app.use(express.static(path.join(__dirname, '../../landing')));

app.use(errorHandler);

scheduleNotifications(cron);

// Do not let a single unhandled rejection kill the process silently mid-session.
process.on('uncaughtException', (err) => {
  console.error('[katha-api] uncaughtException (process stays up):', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[katha-api] unhandledRejection (process stays up):', reason);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  const offer = getLaunchOfferConfig();
  console.log(`Katha API running on http://localhost:${PORT}`);
  console.log(`Landing page: http://localhost:${PORT}/`);
  console.log(`Launch offer: ${offer.mode} (trial ${offer.trial_days}d, gate Ch${offer.subscription_gate_chapter})`);
  if (isMockMode()) console.log('MOCK_MODE enabled — seed data + OTP 123456');
  console.log('CORS: localhost/* + ALLOWED_ORIGINS; CORP=cross-origin for Flutter web');
});

server.on('error', (err) => {
  console.error('[katha-api] listen error:', err);
  process.exit(1);
});

// Keep-alive so idle connections from the browser do not thrash
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;