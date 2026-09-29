import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD');
const range = z.object({ startMin: z.number().int().min(0).max(1439), endMin: z.number().int().min(1).max(1440) }).refine((value) => value.endMin > value.startMin, 'End time must follow start time');
const userBody = z.object({ name: z.string().trim().min(1), email: z.string().email(), password: z.string().min(8) });

export const forgotPasswordSchema = z.object({ body: z.object({ email: z.string().email() }), query: z.object({}), params: z.object({}) });
export const resetPasswordSchema = z.object({
	body: z.object({ token: z.string().length(64), password: z.string().min(8) }),
	query: z.object({}),
	params: z.object({})
});
export const registerSchema = z.object({ body: userBody, query: z.object({}), params: z.object({}) });
export const loginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(1) }), query: z.object({}), params: z.object({}) });
export const emptySchema = z.object({ body: z.object({}).optional(), query: z.object({}), params: z.object({}) });
export const serviceSchema = z.object({ body: z.object({ name: z.string().trim().min(1), durationMin: z.number().int().positive(), bufferAfterMin: z.number().int().nonnegative().default(0), active: z.boolean().optional() }), query: z.object({}), params: z.object({}) });
export const servicePatchSchema = z.object({ body: z.object({ name: z.string().trim().min(1).optional(), durationMin: z.number().int().positive().optional(), bufferAfterMin: z.number().int().nonnegative().optional(), active: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0), query: z.object({}), params: z.object({ id: objectId }) });
export const idParamSchema = z.object({ body: z.object({}).optional(), query: z.object({}), params: z.object({ id: objectId }) });
export const providersQuerySchema = z.object({ body: z.object({}).optional(), query: z.object({ serviceId: objectId.optional() }), params: z.object({}) });
export const slotsQuerySchema = z.object({ body: z.object({}).optional(), query: z.object({ serviceId: objectId, date: dateString }), params: z.object({ id: objectId }) });
export const providerCreateSchema = z.object({ body: z.object({ userId: objectId, serviceIds: z.array(objectId).default([]), timezone: z.string().min(1) }), query: z.object({}), params: z.object({}) });
export const availabilitySchema = z.object({ body: z.object({ rules: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), startMin: z.number().int().min(0).max(1439), endMin: z.number().int().min(1).max(1440) }).refine((value) => value.endMin > value.startMin)) }), query: z.object({}), params: z.object({}) });
export const overrideSchema = z.object({ body: z.object({ date: dateString, type: z.enum(['off', 'custom']), ranges: z.array(range).default([]) }), query: z.object({}), params: z.object({}) });
export const dateRangeSchema = z.object({ body: z.object({}).optional(), query: z.object({ from: z.coerce.date(), to: z.coerce.date() }), params: z.object({}) });
export const bookingCreateSchema = z.object({ body: z.object({ providerId: objectId, serviceId: objectId, start: z.coerce.date() }), query: z.object({}), params: z.object({}) });
export const rescheduleSchema = z.object({ body: z.object({ providerId: objectId, start: z.coerce.date() }), query: z.object({}), params: z.object({ id: objectId }) });