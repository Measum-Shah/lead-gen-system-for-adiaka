import Lead from '../models/Lead.js';
import Quota from '../models/Quota.js';
import { validateLeadStatus, validateDate } from '../utils/validation.js';

export const getCampaignStats = async (req, res) => {
  try {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const quota = await Quota.findOne({ date: today });
    const limit = parseInt(process.env.DAILY_EMAIL_CAP || '100');
    
    // Count pending by status
    const pendingAggregation = await Lead.aggregate([
      { $match: { unsubscribed: false, campaignStatus: { $in: ['instant_pending', 'followup1_pending', 'followup2_pending'] } } },
      { $group: { _id: { type: "$leadType", status: "$campaignStatus" }, count: { $sum: 1 } } }
    ]);
    
    const pendingCounts = {
      website: { instant_pending: 0, followup1_pending: 0, followup2_pending: 0 },
      imported: { instant_pending: 0, followup1_pending: 0, followup2_pending: 0 }
    };
    
    pendingAggregation.forEach(item => {
      if (pendingCounts[item._id.type]) {
        pendingCounts[item._id.type][item._id.status] = item.count;
      }
    });

    res.json({
      success: true,
      quota: {
        used: quota ? quota.count : 0,
        limit,
        importedUsed: quota ? quota.importedCount : 0,
        importedLimit: process.env.IMPORTED_DAILY_CAP ? parseInt(process.env.IMPORTED_DAILY_CAP) : null
      },
      pending: pendingCounts
    });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch campaign stats' });
  }
};

/**
 * Leads Controller
 * 
 * Handles all admin operations for lead management:
 * - Listing with filters and pagination
 * - Status updates
 * - Resending notifications
 * - Excel export
 */

/**
 * Get paginated list of leads with optional filters
 * 
 * @route GET /api/leads
 * @access Protected (requires JWT)
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - from: Start date (ISO format: YYYY-MM-DD)
 * - to: End date (ISO format: YYYY-MM-DD)
 * - status: Filter by status (new, contacted, followed_up, converted, lost)
 * - source: Filter by source
 * - search: Search by name, email, or phone
 * - sortBy: Sort field (default: createdAt)
 * - sortOrder: Sort order (asc/desc, default: desc)
 */
export const getLeads = async (req, res) => {
  try {
    // Extract and validate query parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    
    const { from, to, status, source, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query object
    const query = {};
    
    // Date range filter
    if (from || to) {
      query.createdAt = {};
      
      if (from) {
        const fromValidation = validateDate(from);
        if (!fromValidation.valid) {
          return res.status(400).json({
            success: false,
            message: 'Invalid "from" date format',
            error: fromValidation.message
          });
        }
        query.createdAt.$gte = fromValidation.date;
      }
      
      if (to) {
        const toValidation = validateDate(to);
        if (!toValidation.valid) {
          return res.status(400).json({
            success: false,
            message: 'Invalid "to" date format',
            error: toValidation.message
          });
        }
        // Set time to end of day to include entire day
        const endDate = new Date(toValidation.date);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }
    
    // Status filter
    if (status) {
      const statusValidation = validateLeadStatus(status);
      if (!statusValidation.valid) {
        return res.status(400).json({
          success: false,
          message: statusValidation.message
        });
      }
      query.status = status;
    }
    
    // Source filter
    if (source) {
      query.source = source;
    }
    
    // Search filter (name, email, or phone)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    // Build sort object
    const sortObject = {};
    const allowedSortFields = ['createdAt', 'name', 'email', 'status', 'emailStatus', 'smsStatus'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortObject[sortField] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const [leads, totalCount] = await Promise.all([
      Lead.find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() for better performance (returns plain JS objects)
      Lead.countDocuments(query)
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Return response
    res.json({
      success: true,
      data: {
        leads,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          from: from || null,
          to: to || null,
          status: status || null,
          source: source || null,
          search: search || null,
          sortBy: sortField,
          sortOrder
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Get a single lead by ID
 * 
 * @route GET /api/leads/:id
 * @access Protected (requires JWT)
 */
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    res.json({
      success: true,
      data: lead
    });
    
  } catch (error) {
    console.error('Error fetching lead:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching lead',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Update lead status
 * 
 * @route PATCH /api/leads/:id/status
 * @access Protected (requires JWT)
 */
export const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const statusValidation = validateLeadStatus(status);
    if (!statusValidation.valid) {
      return res.status(400).json({
        success: false,
        message: statusValidation.message
      });
    }
    
    // Find and update lead
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    console.log(`Lead ${lead._id} status updated to: ${status}`);
    
    res.json({
      success: true,
      message: 'Lead status updated successfully',
      data: lead
    });
    
  } catch (error) {
    console.error('Error updating lead status:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating lead status',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Get leads statistics
 * 
 * @route GET /api/leads/stats
 * @access Protected (requires JWT)
 */
export const getLeadsStats = async (req, res) => {
  try {
    const [
      totalLeads,
      newLeads,
      contactedLeads,
      convertedLeads,
      emailsSent,
      smsSent,
      emailsFailed,
      smsFailed
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'new' }),
      Lead.countDocuments({ status: 'contacted' }),
      Lead.countDocuments({ status: 'converted' }),
      Lead.countDocuments({ emailStatus: 'sent' }),
      Lead.countDocuments({ smsStatus: 'sent' }),
      Lead.countDocuments({ emailStatus: 'failed' }),
      Lead.countDocuments({ smsStatus: 'failed' })
    ]);
    
    // Get leads by source
    const leadsBySource = await Lead.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get recent leads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLeads = await Lead.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    res.json({
      success: true,
      data: {
        total: totalLeads,
        byStatus: {
          new: newLeads,
          contacted: contactedLeads,
          converted: convertedLeads
        },
        notifications: {
          emailsSent,
          smsSent,
          emailsFailed,
          smsFailed,
          emailSuccessRate: totalLeads > 0 ? Math.round((emailsSent / totalLeads) * 100) : 0,
          smsSuccessRate: totalLeads > 0 ? Math.round((smsSent / totalLeads) * 100) : 0
        },
        bySource: leadsBySource,
        recentLeads: {
          last7Days: recentLeads
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching leads statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching lead statistics'
    });
  }
};

/**
 * Delete a specific lead
 * 
 * @route DELETE /api/leads/:id
 * @access Protected
 */
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await Lead.findById(id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    await Lead.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting lead',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Export leads to Excel
 * 
 * @route GET /api/leads/export
 * @access Protected (requires JWT)
 * 
 * Query params: same as getLeads (from, to, status, source, search)
 */
export const exportLeadsToExcel = async (req, res) => {
  try {
    const ExcelJS = (await import('exceljs')).default;
    
    const { from, to, status, source, search } = req.query;
    
    // Build query (same logic as getLeads, but without pagination)
    const query = {};
    
    // Date range filter
    if (from || to) {
      query.createdAt = {};
      
      if (from) {
        const fromValidation = validateDate(from);
        if (!fromValidation.valid) {
          return res.status(400).json({
            success: false,
            message: 'Invalid "from" date format'
          });
        }
        query.createdAt.$gte = fromValidation.date;
      }
      
      if (to) {
        const toValidation = validateDate(to);
        if (!toValidation.valid) {
          return res.status(400).json({
            success: false,
            message: 'Invalid "to" date format'
          });
        }
        const endDate = new Date(toValidation.date);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }
    
    if (status) {
      query.status = status;
    }
    
    if (source) {
      query.source = source;
    }
    
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    // Fetch leads (no limit for export)
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');
    
    // Define columns
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Source', key: 'source', width: 20 },
      { header: 'Created Date', key: 'createdAt', width: 20 },
      { header: 'Email Sent', key: 'emailStatus', width: 15 },
      { header: 'SMS Sent', key: 'smsStatus', width: 15 },
      { header: 'First Touch Date', key: 'firstTouchSentAt', width: 20 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Add data rows
    leads.forEach(lead => {
      worksheet.addRow({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        source: lead.source,
        createdAt: new Date(lead.createdAt).toLocaleString(),
        emailStatus: lead.emailStatus,
        smsStatus: lead.smsStatus,
        firstTouchSentAt: lead.firstTouchSentAt 
          ? new Date(lead.firstTouchSentAt).toLocaleString() 
          : 'N/A'
      });
    });
    
    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'I1'
    };
    
    // Generate filename with date range or timestamp
    let filename = 'leads';
    if (from && to) {
      filename += `_${from}_to_${to}`;
    } else if (from) {
      filename += `_from_${from}`;
    } else if (to) {
      filename += `_until_${to}`;
    } else {
      filename += `_${new Date().toISOString().split('T')[0]}`;
    }
    filename += '.xlsx';
    
    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    
    // Write to response
    await workbook.xlsx.write(res);
    
    console.log(`Exported ${leads.length} leads to Excel: ${filename}`);
    
  } catch (error) {
    console.error('Error exporting leads to Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting leads',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Resend first-touch notifications for a lead
 * 
 * @route POST /api/leads/:id/resend
 * @access Protected (requires JWT)
 */
export const resendNotifications = async (req, res) => {
  try {
    const { retryFailedNotifications } = await import('../services/notify.js');
    
    // Check if lead exists
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    console.log(`Resending notifications for lead: ${lead._id} (${lead.name})`);
    
    // Trigger retry
    const result = await retryFailedNotifications(req.params.id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Notifications resent successfully',
        data: {
          emailRetried: result.emailRetried,
          smsRetried: result.smsRetried,
          emailSuccess: result.emailSuccess,
          smsSuccess: result.smsSuccess,
          emailStatus: result.emailStatus,
          smsStatus: result.smsStatus
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || 'Failed to resend notifications',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error resending notifications:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error resending notifications',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};
