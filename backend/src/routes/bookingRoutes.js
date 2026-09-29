import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/bookingController.js';
import { bookingCreateSchema, emptySchema, idParamSchema, rescheduleSchema } from '../validators/schemas.js';

const router = Router();
router.post('/', authenticate, requireRole('customer'), validate(bookingCreateSchema), controller.create);
router.get('/me', authenticate, requireRole('customer'), validate(emptySchema), controller.mine);
router.patch('/:id/cancel', authenticate, validate(idParamSchema), controller.cancel);
router.post('/:id/reschedule', authenticate, requireRole('customer'), validate(rescheduleSchema), controller.reschedule);
export default router;