import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  durationMin: { type: Number, required: true, min: 1 },
  bufferAfterMin: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Service = mongoose.model('Service', serviceSchema);