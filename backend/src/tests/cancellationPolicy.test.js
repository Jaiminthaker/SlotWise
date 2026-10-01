import { canCancel } from '../services/cancellationPolicy.js';

describe('canCancel', () => {
  const now = new Date('2030-01-01T12:00:00.000Z');

  it('allows cancellation outside the free cancellation window', () => {
    // 25 hours ahead with default 24h window
    const booking = {
      status: 'confirmed',
      start: new Date('2030-01-02T13:00:00.000Z')
    };
    expect(canCancel(booking, now)).toBe(true);
  });

  it('allows cancellation exactly at the threshold', () => {
    // Exactly 24 hours ahead
    const booking = {
      status: 'confirmed',
      start: new Date('2030-01-02T12:00:00.000Z')
    };
    expect(canCancel(booking, now)).toBe(true);
  });

  it('blocks cancellation inside the free cancellation window', () => {
    // 23 hours ahead
    const booking = {
      status: 'confirmed',
      start: new Date('2030-01-02T11:00:00.000Z')
    };
    expect(canCancel(booking, now)).toBe(false);
  });

  it('blocks cancellation for bookings in the past', () => {
    const booking = {
      status: 'confirmed',
      start: new Date('2030-01-01T10:00:00.000Z')
    };
    expect(canCancel(booking, now)).toBe(false);
  });

  it('blocks cancellation if booking is already cancelled', () => {
    const booking = {
      status: 'cancelled',
      start: new Date('2030-01-03T12:00:00.000Z')
    };
    expect(canCancel(booking, now)).toBe(false);
  });

  it('supports custom cancellation window hours', () => {
    const booking = {
      status: 'confirmed',
      start: new Date('2030-01-01T15:00:00.000Z') // 3 hours ahead
    };
    expect(canCancel(booking, now, 2)).toBe(true);
    expect(canCancel(booking, now, 4)).toBe(false);
  });
});