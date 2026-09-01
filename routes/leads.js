import express from 'express';
import { 
  getLeads, 
  getLeadById,
  getLeadsStats,
  updateLeadStatus,
  exportLeadsToExcel,
  resendNotifications
} from '../controllers/leadsController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

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
 * @desc    Resend first-touch notifications
 * @access  Protected (requires JWT)
 */
router.post('/:id/resend', resendNotifications);

export default router;
