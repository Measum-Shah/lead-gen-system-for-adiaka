import Settings from '../models/Settings.js';

/**
 * Get Settings
 * Creates default settings if none exist
 */
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

/**
 * Update Settings
 */
export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    const allowedFields = [
      'companyName', 'websiteUrl', 'supportPhone', 'supportEmail',
      'companyAddress', 'footerSignature', 'whatsappNumber',
      'emailSubject', 'emailBody',
      'day1EmailSubject', 'day1EmailBody',
      'day3EmailSubject', 'day3EmailBody'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();
    res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

import Broadcast from '../models/Broadcast.js';
import Lead from '../models/Lead.js';

export const getActiveBroadcast = async (req, res) => {
  try {
    const broadcast = await Broadcast.findOne({ status: 'active' });
    res.json({ success: true, data: broadcast });
  } catch (error) {
    console.error('Error fetching broadcast:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch broadcast' });
  }
};

export const startBroadcast = async (req, res) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ success: false, message: 'Subject and body required' });

    // Mark existing active broadcast as completed
    await Broadcast.updateMany({ status: 'active' }, { status: 'completed' });

    const newBroadcast = new Broadcast({ subject, body });
    await newBroadcast.save();

    res.json({ success: true, message: 'Mass email campaign started', data: newBroadcast });
  } catch (error) {
    console.error('Error starting broadcast:', error);
    res.status(500).json({ success: false, message: 'Failed to start broadcast' });
  }
};

/**
 * Get all campaigns with counts and formatted folder names
 */
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Broadcast.find().sort({ createdAt: -1 }).lean();
    
    // Total eligible leads count for active broadcast estimation
    const totalEligibleLeads = await Lead.countDocuments({
      unsubscribed: false,
      campaignStatus: { $ne: 'bounced' }
    });

    const campaignsWithCounts = await Promise.all(
      campaigns.map(async (c) => {
        const sentCount = await Lead.countDocuments({
          broadcastsReceived: c._id
        });

        const folderDate = new Date(c.createdAt).toISOString().split('T')[0];
        const queuedCount = c.status === 'active' 
          ? Math.max(0, totalEligibleLeads - sentCount)
          : 0;

        return {
          ...c,
          folderName: `campaign-${folderDate}`,
          sentCount,
          queuedCount,
          totalAudience: c.status === 'active' ? totalEligibleLeads : sentCount,
          dailyRate: 60
        };
      })
    );

    res.json({ success: true, data: campaignsWithCounts });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
  }
};

/**
 * Get leads for a specific campaign (Sent vs Queued)
 */
export const getCampaignLeads = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'sent', search = '', page = 1, limit = 100 } = req.query;

    const campaign = await Broadcast.findById(id).lean();
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    if (type === 'sent') {
      const query = {
        broadcastsReceived: campaign._id
      };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const totalCount = await Lead.countDocuments(query);
      const rawLeads = await Lead.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      const leads = rawLeads.map((lead) => {
        const logEntry = (lead.emailLog || []).slice().reverse().find(l => l.stage === 'mass_email');
        return {
          _id: lead._id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          leadType: lead.leadType || 'website',
          source: lead.source,
          sentAt: logEntry?.sentAt || lead.updatedAt || lead.createdAt,
          status: 'sent'
        };
      });

      return res.json({
        success: true,
        data: {
          campaign: {
            _id: campaign._id,
            subject: campaign.subject,
            body: campaign.body,
            status: campaign.status,
            createdAt: campaign.createdAt,
            folderName: `campaign-${new Date(campaign.createdAt).toISOString().split('T')[0]}`
          },
          leads,
          totalCount,
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          type: 'sent'
        }
      });
    } else {
      // type === 'queue'
      if (campaign.status !== 'active') {
        return res.json({
          success: true,
          data: {
            campaign: {
              _id: campaign._id,
              subject: campaign.subject,
              body: campaign.body,
              status: campaign.status,
              createdAt: campaign.createdAt,
              folderName: `campaign-${new Date(campaign.createdAt).toISOString().split('T')[0]}`
            },
            leads: [],
            totalCount: 0,
            currentPage: 1,
            totalPages: 0,
            type: 'queue',
            message: 'Campaign is completed. No leads currently in queue.'
          }
        });
      }

      const query = {
        unsubscribed: false,
        campaignStatus: { $ne: 'bounced' },
        broadcastsReceived: { $ne: campaign._id }
      };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const totalCount = await Lead.countDocuments(query);
      const rawLeads = await Lead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      const leads = rawLeads.map((lead, idx) => {
        const absoluteIndex = skip + idx;
        const dayNumber = Math.floor(absoluteIndex / 60) + 1;
        const estDate = new Date();
        estDate.setDate(estDate.getDate() + (dayNumber - 1));

        return {
          _id: lead._id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          leadType: lead.leadType || 'website',
          source: lead.source,
          createdAt: lead.createdAt,
          queuePosition: absoluteIndex + 1,
          estimatedDay: dayNumber,
          estimatedDate: estDate.toISOString().split('T')[0],
          status: 'queued'
        };
      });

      return res.json({
        success: true,
        data: {
          campaign: {
            _id: campaign._id,
            subject: campaign.subject,
            body: campaign.body,
            status: campaign.status,
            createdAt: campaign.createdAt,
            folderName: `campaign-${new Date(campaign.createdAt).toISOString().split('T')[0]}`
          },
          leads,
          totalCount,
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          type: 'queue',
          dailyRate: 60
        }
      });
    }
  } catch (error) {
    console.error('Error fetching campaign leads:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch campaign leads' });
  }
};

