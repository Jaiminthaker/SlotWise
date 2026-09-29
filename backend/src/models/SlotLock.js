import mongoose from 'mongoose';

const slotLockSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  unitStart: { type: Date, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true }
}, { timestamps: true });

slotLockSchema.index({ providerId: 1, unitStart: 1 }, { unique: true });

export const SlotLock = mongoose.model('SlotLock', slotLockSchema);