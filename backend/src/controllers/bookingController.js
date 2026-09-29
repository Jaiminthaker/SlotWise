import { Booking } from '../models/Booking.js';
import * as bookings from '../services/bookingService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ booking: await bookings.createBooking({ ...req.validated.body, customerId: req.user.id }) });
});

export const mine = asyncHandler(async (req, res) => {
  res.json({ bookings: await Booking.find({ customerId: req.user.id }).sort({ start: 1 }).populate('providerId').populate('serviceId') });
});

export const cancel = asyncHandler(async (req, res) => {
  res.json({ booking: await bookings.cancelBooking({ bookingId: req.validated.params.id, actor: req.user }) });
});

export const reschedule = asyncHandler(async (req, res) => {
  res.json({ booking: await bookings.rescheduleBooking({ bookingId: req.validated.params.id, customerId: req.user.id, ...req.validated.body }) });
});