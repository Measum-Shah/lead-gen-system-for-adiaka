import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active'
    }
  },
  { timestamps: true }
);

const Broadcast = mongoose.model('Broadcast', broadcastSchema);
export default Broadcast;
