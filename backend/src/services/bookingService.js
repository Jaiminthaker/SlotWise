import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import { Booking } from '../models/Booking.js';
import { SlotLock } from '../models/SlotLock.js';
import { Provider } from '../models/Provider.js';
import { Service } from '../models/Service.js';
import { AvailabilityRule } from '../models/AvailabilityRule.js';
import { DayOverride } from '../models/DayOverride.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';
import { canCancel } from './cancellationPolicy.js';

function getSlotUnits(startDate, endDate) {
  const unitMs = env.SLOT_UNIT_MIN * 60 * 1000;
  const units = [];
  for (let t = startDate.getTime(); t < endDate.getTime(); t += unitMs) {
    units.push(new Date(t));
  }
  return units;
}

async function checkProviderAvailability(provider, startDate, totalDurationMin) {
  const localDay = DateTime.fromJSDate(startDate, { zone: provider.timezone });
  const date = localDay.toISODate();

  const [rules, override] = await Promise.all([
    AvailabilityRule.find({ providerId: provider._id }),
    DayOverride.findOne({ providerId: provider._id, date })
  ]);

  if (override && override.type === 'off') {
    throw new AppError(409, 'PROVIDER_UNAVAILABLE', 'Provider is not available on this date');
  }

  const ranges = override && override.type === 'custom'
    ? (override.ranges ?? [])
    : rules.filter((rule) => rule.dayOfWeek === localDay.weekday % 7);

  const startMin = localDay.hour * 60 + localDay.minute;
  const endMin = startMin + totalDurationMin;
  const fits = ranges.some((range) => startMin >= range.startMin && endMin <= range.endMin);

  if (!fits) {
    throw new AppError(409, 'PROVIDER_UNAVAILABLE', 'Requested time is outside provider available hours');
  }
}

function canUseTransactions() {
  const type = mongoose.connection?.client?.topology?.description?.type;
  return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
}

async function withOptionalTransaction(operation) {
  const useTxn = canUseTransactions();
  let session = null;
  if (useTxn) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }
  }

  try {
    const result = await operation(session);
    if (session) {
      await session.commitTransaction();
    }
    return result;
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch {
        // ignore abort error
      }
    }
    if (error.code === 11000) {
      throw new AppError(409, 'SLOT_TAKEN', 'Slot is already booked');
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

/**
 * Creates a booking and its fixed-unit locks.
 * @param {{ providerId: string, customerId: string, serviceId: string, start: Date }} input Booking details.
 * @returns {Promise<object>} The created booking.
 */
export async function createBooking({ providerId, customerId, serviceId, start }) {
  if (!providerId || !serviceId || !customerId || !start) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Missing required booking fields');
  }

  const startDate = new Date(start);
  if (isNaN(startDate.getTime())) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Invalid start date');
  }

  const slotUnitMs = env.SLOT_UNIT_MIN * 60 * 1000;
  if (startDate.getTime() % slotUnitMs !== 0) {
    throw new AppError(422, 'VALIDATION_ERROR', `Start time must align to ${env.SLOT_UNIT_MIN}-minute intervals`);
  }

  const minNoticeMs = env.MIN_NOTICE_HOURS * 60 * 60 * 1000;
  if (startDate.getTime() < Date.now() + minNoticeMs) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Booking start time must respect minimum notice');
  }

  const [provider, service] = await Promise.all([
    Provider.findById(providerId),
    Service.findOne({ _id: serviceId, active: true })
  ]);

  if (!provider || !service) {
    throw new AppError(404, 'NOT_FOUND', 'Provider or service not found');
  }

  if (!provider.serviceIds.some((id) => id.equals(serviceId))) {
    throw new AppError(400, 'BAD_REQUEST', 'Service is not offered by this provider');
  }

  const totalDurationMin = service.durationMin + (service.bufferAfterMin ?? 0);
  const endDate = new Date(startDate.getTime() + totalDurationMin * 60 * 1000);

  // Check customer double booking
  const customerOverlap = await Booking.findOne({
    customerId,
    status: 'confirmed',
    start: { $lt: endDate },
    end: { $gt: startDate }
  });
  if (customerOverlap) {
    throw new AppError(409, 'CUSTOMER_DOUBLE_BOOKING', 'You already have another confirmed booking during this time');
  }

  // Check provider availability rules and day overrides
  await checkProviderAvailability(provider, startDate, totalDurationMin);

  const units = getSlotUnits(startDate, endDate);

  // Pre-check existing locks or confirmed bookings for provider
  const [existingLock, existingBooking] = await Promise.all([
    SlotLock.findOne({ providerId, unitStart: { $in: units } }),
    Booking.findOne({ providerId, status: 'confirmed', start: { $lt: endDate }, end: { $gt: startDate } })
  ]);
  if (existingLock || existingBooking) {
    throw new AppError(409, 'SLOT_TAKEN', 'Selected slot is no longer available');
  }

  return await withOptionalTransaction(async (session) => {
    let booking;
    try {
      const bookingDoc = new Booking({
        providerId,
        customerId,
        serviceId,
        start: startDate,
        end: endDate,
        status: 'confirmed'
      });
      booking = await bookingDoc.save({ session: session || undefined });

      const lockDocs = units.map((unitStart) => ({
        providerId,
        unitStart,
        bookingId: booking._id
      }));

      await SlotLock.insertMany(lockDocs, { session: session || undefined });
    } catch (err) {
      if (!session && booking?._id) {
        await SlotLock.deleteMany({ bookingId: booking._id });
        await Booking.deleteOne({ _id: booking._id });
      }
      throw err;
    }

    return await Booking.findById(booking._id)
      .populate('providerId')
      .populate('serviceId')
      .session(session || null);
  });
}

/**
 * Cancels a booking and releases its slot locks.
 * @param {{ bookingId: string, actor: object, now?: Date }} input Cancellation details.
 * @returns {Promise<object>} The cancelled booking.
 */
export async function cancelBooking({ bookingId, actor, now = new Date() }) {
  if (!bookingId) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Booking ID is required');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  }

  if (booking.status === 'cancelled') {
    throw new AppError(400, 'BAD_REQUEST', 'Booking is already cancelled');
  }

  if (actor.role === 'customer') {
    if (booking.customerId.toString() !== actor.id.toString()) {
      throw new AppError(403, 'FORBIDDEN', "Cannot cancel another customer's booking");
    }
    if (!canCancel(booking, now)) {
      throw new AppError(403, 'CANCELLATION_POLICY_VIOLATION', 'Booking cannot be cancelled within the cancellation window');
    }
  } else if (actor.role === 'provider') {
    const provider = await Provider.findOne({ userId: actor.id });
    if (!provider || !booking.providerId.equals(provider._id)) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot cancel a booking for another provider');
    }
  }

  return await withOptionalTransaction(async (session) => {
    booking.status = 'cancelled';
    await booking.save({ session: session || undefined });
    await SlotLock.deleteMany({ bookingId: booking._id }, { session: session || undefined });
    return booking;
  });
}

/**
 * Reschedules a booking with atomic slot-lock handling.
 * @param {{ bookingId: string, customerId: string, providerId: string, start: Date }} input New booking details.
 * @returns {Promise<object>} The rescheduled booking.
 */
export async function rescheduleBooking({ bookingId, customerId, providerId, start }) {
  if (!bookingId || !customerId || !start) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Missing required rescheduling parameters');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  }

  if (booking.customerId.toString() !== customerId.toString()) {
    throw new AppError(403, 'FORBIDDEN', "Cannot reschedule another customer's booking");
  }

  if (booking.status !== 'confirmed') {
    throw new AppError(400, 'BAD_REQUEST', 'Only confirmed bookings can be rescheduled');
  }

  if (!canCancel(booking, new Date())) {
    throw new AppError(403, 'CANCELLATION_POLICY_VIOLATION', 'Cannot reschedule within the cancellation window');
  }

  const targetProviderId = providerId || booking.providerId;
  const [provider, service] = await Promise.all([
    Provider.findById(targetProviderId),
    Service.findOne({ _id: booking.serviceId, active: true })
  ]);

  if (!provider || !service) {
    throw new AppError(404, 'NOT_FOUND', 'Provider or service not found');
  }

  if (!provider.serviceIds.some((id) => id.equals(service._id))) {
    throw new AppError(400, 'BAD_REQUEST', 'Provider does not offer this service');
  }

  const startDate = new Date(start);
  if (isNaN(startDate.getTime())) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Invalid start date');
  }

  const slotUnitMs = env.SLOT_UNIT_MIN * 60 * 1000;
  if (startDate.getTime() % slotUnitMs !== 0) {
    throw new AppError(422, 'VALIDATION_ERROR', `Start time must align to ${env.SLOT_UNIT_MIN}-minute intervals`);
  }

  const minNoticeMs = env.MIN_NOTICE_HOURS * 60 * 60 * 1000;
  if (startDate.getTime() < Date.now() + minNoticeMs) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Rescheduled start time must respect minimum notice');
  }

  const totalDurationMin = service.durationMin + (service.bufferAfterMin ?? 0);
  const endDate = new Date(startDate.getTime() + totalDurationMin * 60 * 1000);

  // Check customer double booking, ignoring this booking
  const customerOverlap = await Booking.findOne({
    customerId,
    _id: { $ne: booking._id },
    status: 'confirmed',
    start: { $lt: endDate },
    end: { $gt: startDate }
  });
  if (customerOverlap) {
    throw new AppError(409, 'CUSTOMER_DOUBLE_BOOKING', 'You already have another booking during this time');
  }

  // Check provider availability rules and day overrides
  await checkProviderAvailability(provider, startDate, totalDurationMin);

  const newUnits = getSlotUnits(startDate, endDate);

  // Check existing locks of other bookings for target provider
  const [existingLock, existingBooking] = await Promise.all([
    SlotLock.findOne({
      providerId: targetProviderId,
      unitStart: { $in: newUnits },
      bookingId: { $ne: booking._id }
    }),
    Booking.findOne({
      providerId: targetProviderId,
      _id: { $ne: booking._id },
      status: 'confirmed',
      start: { $lt: endDate },
      end: { $gt: startDate }
    })
  ]);

  if (existingLock || existingBooking) {
    throw new AppError(409, 'SLOT_TAKEN', 'Target slot is already booked');
  }

  const originalStart = booking.start;
  const originalEnd = booking.end;
  const originalProviderId = booking.providerId;

  return await withOptionalTransaction(async (session) => {
    try {
      await SlotLock.deleteMany({ bookingId: booking._id }, { session: session || undefined });

      const lockDocs = newUnits.map((unitStart) => ({
        providerId: targetProviderId,
        unitStart,
        bookingId: booking._id
      }));

      await SlotLock.insertMany(lockDocs, { session: session || undefined });

      booking.providerId = targetProviderId;
      booking.start = startDate;
      booking.end = endDate;
      await booking.save({ session: session || undefined });
    } catch (err) {
      if (!session) {
        // Rollback locks to original state in standalone mode
        await SlotLock.deleteMany({ bookingId: booking._id });
        const originalUnits = getSlotUnits(originalStart, originalEnd);
        await SlotLock.insertMany(originalUnits.map((unitStart) => ({
          providerId: originalProviderId,
          unitStart,
          bookingId: booking._id
        })));
        booking.providerId = originalProviderId;
        booking.start = originalStart;
        booking.end = originalEnd;
        await booking.save();
      }
      throw err;
    }

    return await Booking.findById(booking._id)
      .populate('providerId')
      .populate('serviceId')
      .session(session || null);
  });
}