/**
 * Determines whether two half-open time ranges overlap.
 * @param {{ start: Date, end: Date }} a First range.
 * @param {{ start: Date, end: Date }} b Second range.
 * @returns {boolean} Whether the ranges overlap.
 */
export function isOverlapping(a, b) {
  return new Date(a.start).getTime() < new Date(b.end).getTime()
    && new Date(b.start).getTime() < new Date(a.end).getTime();
}