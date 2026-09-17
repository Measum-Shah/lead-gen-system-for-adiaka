import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
