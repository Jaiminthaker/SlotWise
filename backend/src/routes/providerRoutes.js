import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as controller from '../controllers/providerController.js';
import * as serviceController from '../controllers/serviceController.js';
import { dateRangeSchema, overrideSchema, providersQuerySchema, providerCreateSchema, slotsQuerySchema, availabilitySchema } from '../validators/schemas.js';

const router = Router();
router.get('/', validate(providersQuerySchema), asyncHandler(serviceController.listProviders));
router.get('/:id/slots', validate(slotsQuerySchema), controller.slots);
router.put('/me/availability', authenticate, requireRole('provider'), validate(availabilitySchema), controller.replaceAvailability);
router.post('/me/overrides', authenticate, requireRole('provider'), validate(overrideSchema), controller.addOverride);
router.get('/me/bookings', authenticate, requireRole('provider'), validate(dateRangeSchema), controller.myBookings);
export default router;