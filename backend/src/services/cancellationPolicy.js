/**
 * Checks whether a booking can be cancelled under the configured policy.
 * @param {object} booking The booking to evaluate.
 * @param {Date} now Current instant.
 * @returns {boolean} Whether cancellation is permitted.
 */
export function canCancel(booking, now) {
  throw new Error('Not implemented');
}