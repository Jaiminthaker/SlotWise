import mongoose from 'mongoose';

const availabilityRuleSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startMin: { type: Number, required: true, min: 0, max: 1439 },
  endMin: { type: Number, required: true, min: 1, max: 1440 }
}, { timestamps: true });

export const AvailabilityRule = mongoose.model('AvailabilityRule', availabilityRuleSchema);