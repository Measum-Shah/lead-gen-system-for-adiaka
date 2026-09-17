import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    source: {
      type: String,
      default: 'wordpress-form',
      trim: true
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'followed_up', 'converted', 'lost'],
      default: 'new'
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    smsStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    firstTouchSentAt: {
      type: Date,
      default: null
    },
    duplicateSubmissions: [{
      type: Date
    }]
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
leadSchema.index({ createdAt: -1 });
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });

// Virtual for formatted creation date
leadSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toISOString().split('T')[0];
});

// Method to check if first touch was sent
leadSchema.methods.isFirstTouchSent = function() {
  return this.emailStatus === 'sent' || this.smsStatus === 'sent';
};

// Method to check if both notifications succeeded
leadSchema.methods.isFullyNotified = function() {
  return this.emailStatus === 'sent' && this.smsStatus === 'sent';
};

// Static method to get leads by date range
leadSchema.statics.findByDateRange = function(startDate, endDate, options = {}) {
  const query = {};
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      // Include the entire end date by setting time to end of day
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDateTime;
    }
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.source) {
    query.source = options.source;
  }
  
  return this.find(query);
};

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
