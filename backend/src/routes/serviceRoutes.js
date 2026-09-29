import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/serviceController.js';
import { emptySchema, idParamSchema, servicePatchSchema, serviceSchema } from '../validators/schemas.js';

const router = Router();
router.get('/', validate(emptySchema), asyncHandler(controller.list));
router.post('/', authenticate, requireRole('admin'), validate(serviceSchema), asyncHandler(controller.create));
router.patch('/:id', authenticate, requireRole('admin'), validate(servicePatchSchema), asyncHandler(controller.update));
router.delete('/:id', authenticate, requireRole('admin'), validate(idParamSchema), asyncHandler(controller.remove));
export default router;