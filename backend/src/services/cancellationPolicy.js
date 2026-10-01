import { env } from '../config/env.js';

/**
 * Checks whether a booking can be cancelled under the configured policy.
 * @param {object} booking The booking to evaluate.
 * @param {Date} [now] Current instant.
 * @param {number} [freeCancelHours] Free cancellation window in hours.
 * @returns {boolean} Whether cancellation is permitted.
 */
export function canCancel(booking, now = new Date(), freeCancelHours = env.FREE_CANCEL_HOURS) {
  if (!booking || !booking.start) return false;
  if (booking.status && booking.status !== 'confirmed') return false;
  const bookingStart = new Date(booking.start).getTime();
  const current = new Date(now).getTime();
  if (isNaN(bookingStart) || isNaN(current)) return false;

  const freeCancelMs = freeCancelHours * 60 * 60 * 1000;
  return bookingStart - current >= freeCancelMs;
}