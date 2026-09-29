import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  role: { type: String, enum: ['admin', 'provider', 'customer'], default: 'customer', required: true }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);