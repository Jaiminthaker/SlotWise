import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/authController.js';
import { emptySchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../validators/schemas.js';

const router = Router();
const passwordResetLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	handler: (req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many password reset requests. Try again later.' } })
});
router.post('/register', validate(registerSchema), asyncHandler(controller.register));
router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.post('/logout', authenticate, validate(emptySchema), asyncHandler(controller.logout));
router.get('/me', authenticate, validate(emptySchema), asyncHandler(controller.me));
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), asyncHandler(controller.resetPassword));
export default router;