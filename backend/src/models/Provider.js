import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  timezone: { type: String, required: true, default: 'UTC' }
}, { timestamps: true });

export const Provider = mongoose.model('Provider', providerSchema);