import { Router } from 'express';
import { getRevenueConfig } from '../config/revenue.js';
import { getLaunchOfferConfig } from '../services/launchOffer.js';

export const configRouter = Router();

/** Public launch-offer config — clients adapt paywall UX without hardcoding (DEV-004). */
configRouter.get('/launch-offer', (_req, res) => {
  res.json(getLaunchOfferConfig());
});

/** Public revenue split — 60/40 per DEV-003 founder decision. */
configRouter.get('/revenue', (_req, res) => {
  res.json(getRevenueConfig());
});