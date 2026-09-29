import mongoose from 'mongoose';

const dayOverrideSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  type: { type: String, enum: ['off', 'custom'], required: true },
  ranges: [{ startMin: { type: Number, required: true }, endMin: { type: Number, required: true } }]
}, { timestamps: true });

export const DayOverride = mongoose.model('DayOverride', dayOverrideSchema);