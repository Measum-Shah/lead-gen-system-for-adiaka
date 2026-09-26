import express from 'express';
import { 
  getSettings, 
  updateSettings, 
  getActiveBroadcast, 
  startBroadcast,
  getAllCampaigns,
  getCampaignLeads
} from '../controllers/settingsController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getSettings);
router.put('/', updateSettings);

router.get('/broadcast', getActiveBroadcast);
router.post('/broadcast', startBroadcast);

router.get('/campaigns', getAllCampaigns);
router.get('/campaigns/:id/leads', getCampaignLeads);

export default router;
