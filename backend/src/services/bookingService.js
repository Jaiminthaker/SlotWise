/**
 * Creates a booking and its fixed-unit locks.
 * @param {{ providerId: string, customerId: string, serviceId: string, start: Date }} input Booking details.
 * @returns {Promise<object>} The created booking.
 */
export async function createBooking(input) {
  throw new Error('Not implemented');
}

/**
 * Cancels a booking and releases its slot locks.
 * @param {{ bookingId: string, actor: object, now?: Date }} input Cancellation details.
 * @returns {Promise<object>} The cancelled booking.
 */
export async function cancelBooking(input) {
  throw new Error('Not implemented');
}

/**
 * Reschedules a booking with atomic slot-lock handling.
 * @param {{ bookingId: string, customerId: string, providerId: string, start: Date }} input New booking details.
 * @returns {Promise<object>} The rescheduled booking.
 */
export async function rescheduleBooking(input) {
  throw new Error('Not implemented');
}