import Lead from '../models/Lead.js';
import { validateLeadSubmission } from '../utils/validation.js';

/**
 * Handle incoming lead submissions from WordPress webhook
 * 
 * @route POST /api/webhook/lead
 * @access Protected (webhook secret required)
 */
export const receiveLead = async (req, res) => {
  try {
    const { name, email, phone, source } = req.body;
    
    // Validate the incoming data
    const validation = validateLeadSubmission({ name, email, phone, source });
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    // Check if lead with this email already exists
    const existingLead = await Lead.findOne({ email: validation.data.email });
    
    if (existingLead) {
      // Update existing lead instead of creating duplicate
      existingLead.name = validation.data.name;
      existingLead.phone = validation.data.phone;
      if (validation.data.source) {
        existingLead.source = validation.data.source;
      }
      
      await existingLead.save();
      
      console.log(`Lead updated: ${existingLead.email} (ID: ${existingLead._id})`);
      
      return res.status(200).json({
        success: true,
        message: 'Lead updated successfully',
        leadId: existingLead._id
      });
    }
    
    // Create new lead
    const lead = new Lead(validation.data);
    await lead.save();
    
    console.log(`New lead created: ${lead.email} (ID: ${lead._id})`);
    
    // Respond immediately with 201 Created
    res.status(201).json({
      success: true,
      message: 'Lead received successfully',
      leadId: lead._id
    });
    
    // Trigger first-touch notifications asynchronously (fire and forget)
    // This will be implemented in Task 7, but we'll import it here
    // Import dynamically to avoid circular dependency issues
    setImmediate(async () => {
      try {
        // Dynamic import to be added after notification service is created
        const { triggerFirstTouch } = await import('../services/notify.js');
        await triggerFirstTouch(lead._id);
        console.log(`First-touch notifications triggered for lead: ${lead._id}`);
      } catch (error) {
        // Log error but don't crash - notification failure shouldn't affect lead creation
        console.error(`Failed to trigger notifications for lead ${lead._id}:`, error.message);
      }
    });
    
  } catch (error) {
    console.error('Error processing lead submission:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A lead with this email already exists'
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Error processing lead submission',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};
