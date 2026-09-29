import { isOverlapping } from '../utils/overlap.js';

describe('isOverlapping', () => {
  it('detects overlap and treats touching endpoints as non-overlapping', () => {
    expect(isOverlapping({ start: new Date('2030-01-01T09:00:00Z'), end: new Date('2030-01-01T10:00:00Z') }, { start: new Date('2030-01-01T09:59:00Z'), end: new Date('2030-01-01T11:00:00Z') })).toBe(true);
    expect(isOverlapping({ start: new Date('2030-01-01T09:00:00Z'), end: new Date('2030-01-01T10:00:00Z') }, { start: new Date('2030-01-01T10:00:00Z'), end: new Date('2030-01-01T11:00:00Z') })).toBe(false);
  });
});