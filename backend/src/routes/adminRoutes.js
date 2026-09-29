import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createProvider } from '../controllers/serviceController.js';
import { providerCreateSchema } from '../validators/schemas.js';

const router = Router();
router.post('/providers', authenticate, requireRole('admin'), validate(providerCreateSchema), asyncHandler(createProvider));
export default router;