import express from 'express';
import { receiveLead } from '../controllers/webhookController.js';
import verifyWebhookSecret from '../middleware/verifyWebhookSecret.js';

const router = express.Router();

/**
 * @route   POST /api/webhook/lead
 * @desc    Receive lead submissions from WordPress form
 * @access  Protected (requires webhook secret)
 * 
 * IMPORTANT - Render Free Tier Cold Start:
 * This endpoint may experience 30-50 second delays on first request after 15min idle.
 * WordPress wp_remote_post timeout should be set to 45 seconds to accommodate cold starts.
 * Since wp_remote_post uses 'blocking' => false, this won't impact visitor experience.
 * 
 * Recommended UptimeRobot configuration:
 * - Monitor: GET /api/health every 10 minutes
 * - This prevents cold starts by keeping the server warm
 */
router.post('/lead', verifyWebhookSecret, receiveLead);

import { mailgunWebhook } from '../controllers/webhookController.js';
router.post('/mailgun', mailgunWebhook);

export default router;
