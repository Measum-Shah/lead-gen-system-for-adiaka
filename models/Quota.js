import mongoose from 'mongoose';

const quotaSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0
  },
  massCount: {
    type: Number,
    default: 0
  },
  websiteCount: {
    type: Number,
    default: 0
  },
  importedCount: {
    type: Number,
    default: 0
  }
});

const Quota = mongoose.model('Quota', quotaSchema);

export default Quota;
