import Quota from '../models/Quota.js';

const DAILY_EMAIL_CAP = parseInt(process.env.DAILY_EMAIL_CAP || '100');
const MASS_EMAIL_CAP = 60;
const WEBSITE_RESERVED_CAP = 40;

const getTodayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Check if quota allows sending. If true, atomically consume 1 quota.
 * @param {string} type - 'website' or 'mass'
 * @param {boolean} massIsActive - whether a mass email is currently active
 * @returns {boolean} - true if allowed and consumed, false if cap hit
 */
export const consumeQuota = async (type = 'website', massIsActive = false) => {
  const today = getTodayDateStr();
  
  // Ensure doc exists
  await Quota.updateOne(
    { date: today },
    { $setOnInsert: { date: today, count: 0, importedCount: 0, massCount: 0, websiteCount: 0 } },
    { upsert: true }
  );

  const filter = { 
    date: today,
    count: { $lt: DAILY_EMAIL_CAP }
  };
  
  const update = { $inc: { count: 1 } };

  if (type === 'mass') {
    filter.massCount = { $lt: MASS_EMAIL_CAP };
    update.$inc.massCount = 1;
  } else if (type === 'website') {
    if (massIsActive) {
      filter.websiteCount = { $lt: WEBSITE_RESERVED_CAP };
    }
    update.$inc.websiteCount = 1;
  }

  const updatedQuota = await Quota.findOneAndUpdate(filter, update, { new: true });
  return !!updatedQuota;
};

export const refundQuota = async (type = 'website') => {
  const today = getTodayDateStr();
  const update = { $inc: { count: -1 } };
  
  if (type === 'mass') {
    update.$inc.massCount = -1;
  } else if (type === 'website') {
    update.$inc.websiteCount = -1;
  }
  
  await Quota.updateOne({ date: today }, update);
};

export const getQuotaStatus = async () => {
  const today = getTodayDateStr();
  const quota = await Quota.findOne({ date: today });
  
  return {
    limit: DAILY_EMAIL_CAP,
    used: quota ? quota.count : 0,
    remaining: DAILY_EMAIL_CAP - (quota ? quota.count : 0),
    massUsed: quota ? quota.massCount : 0,
    massLimit: MASS_EMAIL_CAP,
    websiteUsed: quota ? quota.websiteCount : 0
  };
};
