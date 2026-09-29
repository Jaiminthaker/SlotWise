import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { sendPasswordResetEmail } from './emailService.js';

export async function registerUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({ name, email, passwordHash, role: 'customer' });
    return user;
  } catch (error) {
    if (error.code === 11000) throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists');
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }
  return user;
}

export function createAccessToken(user) {
  return jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return;

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const resetUrl = new URL('/reset-password', env.CLIENT_ORIGIN);
  resetUrl.searchParams.set('token', token);
  try {
    await sendPasswordResetEmail({ email: user.email, resetUrl: resetUrl.toString() });
  } catch (error) {
    console.error('Unable to send password reset email:', error);
  }
}

export async function resetPassword({ token, password }) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() }
  }, {
    $set: { passwordHash },
    $unset: { passwordResetTokenHash: 1, passwordResetExpires: 1 }
  }, { new: true });

  if (!user) throw new AppError(400, 'INVALID_RESET_TOKEN', 'This password reset link is invalid or expired');
}