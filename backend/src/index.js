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
import { getLaunchOfferConfig } from './services/launchOffer.js';
import { errorHandler } from './middleware/errorHandler.js';
import { scheduleNotifications } from './services/notifications.js';
import { isMockMode } from './lib/mockMode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001,http://127.0.0.1:3001').split(',');

app.use(helmet());
app.use(compression()); // Gzip/Brotli for all responses - big win for chapter text
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'katha-api',
    version: '1.0.0',
    mock_mode: isMockMode(),
    launch_offer: getLaunchOfferConfig(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/creators', creatorsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/config', configRouter);
app.use('/api/engagement', engagementRouter);

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