import express from 'express';
import { getSettings, updateSettings, getActiveBroadcast, startBroadcast } from '../controllers/settingsController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getSettings);
router.put('/', updateSettings);

router.get('/broadcast', getActiveBroadcast);
router.post('/broadcast', startBroadcast);

export default router;
