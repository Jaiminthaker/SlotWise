import { AvailabilityRule } from '../models/AvailabilityRule.js';
import { Booking } from '../models/Booking.js';
import { DayOverride } from '../models/DayOverride.js';
import { Provider } from '../models/Provider.js';
import { Service } from '../models/Service.js';
import { generateSlots } from '../services/slotGenerator.js';
import * as availability from '../services/availabilityService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { DateTime } from 'luxon';

export const slots = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { serviceId, date } = req.validated.query;
  const [provider, service] = await Promise.all([Provider.findById(id), Service.findOne({ _id: serviceId, active: true })]);
  if (!provider || !service || !provider.serviceIds.some((value) => value.equals(serviceId))) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Provider or service not found' } });
  const localDay = DateTime.fromISO(date, { zone: provider.timezone });
  const dayStart = localDay.startOf('day').toUTC().toJSDate();
  const dayEnd = localDay.plus({ days: 1 }).startOf('day').toUTC().toJSDate();
  const [rules, override, bookings] = await Promise.all([
    AvailabilityRule.find({ providerId: id }),
    DayOverride.findOne({ providerId: id, date }),
    Booking.find({ providerId: id, status: 'confirmed', start: { $lt: dayEnd }, end: { $gt: dayStart } })
  ]);
  res.json({ slots: generateSlots({ rules, override, bookings, service, date, timezone: provider.timezone, now: new Date(), slotUnitMin: env.SLOT_UNIT_MIN, minNoticeHours: env.MIN_NOTICE_HOURS }) });
});

export const replaceAvailability = asyncHandler(async (req, res) => {
  res.json({ rules: await availability.replaceAvailability(req.user.id, req.validated.body.rules) });
});

export const addOverride = asyncHandler(async (req, res) => {
  res.status(201).json({ override: await availability.addOverride(req.user.id, req.validated.body) });
});

export const myBookings = asyncHandler(async (req, res) => {
  const provider = await availability.getMyProvider(req.user.id);
  const { from, to } = req.validated.query;
  res.json({ bookings: await Booking.find({ providerId: provider.id, start: { $gte: from, $lt: to } }).populate('customerId', 'name email').populate('serviceId', 'name durationMin') });
});