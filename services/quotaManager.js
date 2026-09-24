import Quota from '../models/Quota.js';

const DAILY_EMAIL_CAP = parseInt(process.env.DAILY_EMAIL_CAP || '100');
const IMPORTED_DAILY_CAP = process.env.IMPORTED_DAILY_CAP ? parseInt(process.env.IMPORTED_DAILY_CAP) : null;

const getTodayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Check if quota allows sending. If true, atomically consume 1 quota.
 * @param {boolean} isImported - Whether the lead is from import source
 * @returns {boolean} - true if allowed and consumed, false if cap hit
 */
export const consumeQuota = async (isImported = false) => {
  const today = getTodayDateStr();
  
  // Ensure doc exists
  await Quota.updateOne(
    { date: today },
    { $setOnInsert: { date: today, count: 0, importedCount: 0 } },
    { upsert: true }
  );

  const filter = { 
    date: today,
    count: { $lt: DAILY_EMAIL_CAP }
  };
  
  if (isImported && IMPORTED_DAILY_CAP !== null) {
    filter.importedCount = { $lt: IMPORTED_DAILY_CAP };
  }

  const update = { $inc: { count: 1 } };
  if (isImported) {
    update.$inc.importedCount = 1;
  }

  const updatedQuota = await Quota.findOneAndUpdate(filter, update, { new: true });
  return !!updatedQuota;
};

export const refundQuota = async (isImported = false) => {
  const today = getTodayDateStr();
  const update = { $inc: { count: -1 } };
  if (isImported) {
    update.$inc.importedCount = -1;
  }
  await Quota.updateOne({ date: today }, update);
};

export const getQuotaStatus = async () => {
  const today = getTodayDateStr();
  const quota = await Quota.findOne({ date: today });
  const count = quota ? quota.count : 0;
  const importedCount = quota ? quota.importedCount : 0;
  
  return {
    limit: DAILY_EMAIL_CAP,
    used: count,
    remaining: DAILY_EMAIL_CAP - count,
    importedLimit: IMPORTED_DAILY_CAP,
    importedUsed: importedCount
  };
};
