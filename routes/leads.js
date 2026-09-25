import express from 'express';
import { 
  getLeads, 
  getLeadById,
  getLeadsStats,
  getCampaignStats,
  specificSend,
  updateLeadStatus,
  exportLeadsToExcel,
  resendNotifications,
  deleteLead
} from '../controllers/leadsController.js';
import requireAuth from '../middleware/requireAuth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/leads/campaign-stats
 * @desc    Get campaign scheduling statistics
 * @access  Protected (requires JWT)
 */
router.get('/campaign-stats', getCampaignStats);

/**
 * @route   POST /api/leads/specific-send
 * @desc    Send custom email to specific selected leads
 * @access  Protected (requires JWT)
 */
router.post('/specific-send', specificSend);

/**
 * @route   GET /api/leads/stats
 * @desc    Get leads statistics and analytics
 * @access  Protected (requires JWT)
 */
router.get('/stats', getLeadsStats);

/**
 * @route   GET /api/leads/export
 * @desc    Export leads to Excel with optional filters
 * @access  Protected (requires JWT)
 * @query   from, to, status, source, search
 */
router.get('/export', exportLeadsToExcel);

/**
 * @route   GET /api/leads
 * @desc    Get paginated list of leads with filters
 * @access  Protected (requires JWT)
 * @query   page, limit, from, to, status, source, search, sortBy, sortOrder
 */
router.get('/', getLeads);

/**
 * @route   GET /api/leads/:id
 * @desc    Get a single lead by ID
 * @access  Protected (requires JWT)
 */
router.get('/:id', getLeadById);

/**
 * @route   PATCH /api/leads/:id/status
 * @desc    Update lead status
 * @access  Protected (requires JWT)
 * @body    { status: string }
 */
router.patch('/:id/status', updateLeadStatus);

/**
 * @route   POST /api/leads/:id/resend
 * @desc    Resend failed notifications
 * @access  Protected (requires JWT)
 */
router.post('/:id/resend', resendNotifications);

/**
 * @route   DELETE /api/leads/:id
 * @desc    Delete a lead
 * @access  Protected (requires JWT)
 */
router.delete('/:id', deleteLead);

/**
 * @route   POST /api/leads/import/preview
 * @desc    Parse uploaded file and return headers/preview
 * @access  Protected (requires JWT)
 */
import { previewImport, importLeads } from '../controllers/importController.js';
router.post('/import/preview', upload.single('file'), previewImport);

/**
 * @route   POST /api/leads/import
 * @desc    Import leads with column mapping
 * @access  Protected (requires JWT)
 */
router.post('/import', upload.single('file'), importLeads);

export default router;
