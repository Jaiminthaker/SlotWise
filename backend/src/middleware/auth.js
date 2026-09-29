import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.slotwise_token;
    if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired session'));
  }
}