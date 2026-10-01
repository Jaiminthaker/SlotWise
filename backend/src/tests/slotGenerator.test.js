import { DateTime } from 'luxon';
import { generateSlots } from '../services/slotGenerator.js';

describe('generateSlots', () => {
  const baseInput = {
    rules: [{ dayOfWeek: 1, startMin: 9 * 60, endMin: 10 * 60 + 30 }],
    override: null,
    bookings: [],
    service: { durationMin: 30, bufferAfterMin: 0 },
    date: '2030-01-07',
    timezone: 'UTC',
    now: new Date('2030-01-07T06:00:00.000Z'),
    minNoticeHours: 0
  };

  it('returns available starts as UTC dates on the configured unit grid', () => {
    const slots = generateSlots(baseInput);
    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2030-01-07T09:00:00.000Z',
      '2030-01-07T09:15:00.000Z',
      '2030-01-07T09:30:00.000Z',
      '2030-01-07T09:45:00.000Z',
      '2030-01-07T10:00:00.000Z'
    ]);
  });

  it('honors service buffer and requires the full duration to fit', () => {
    const slots = generateSlots({ ...baseInput, service: { durationMin: 30, bufferAfterMin: 15 } });
    expect(slots.map((slot) => DateTime.fromJSDate(slot, { zone: 'utc' }).toFormat('HH:mm'))).toEqual(['09:00', '09:15', '09:30', '09:45']);
  });

  it('filters overlaps but allows a slot to end when a booking starts', () => {
    const slots = generateSlots({
      ...baseInput,
      bookings: [{ start: new Date('2030-01-07T09:30:00.000Z'), end: new Date('2030-01-07T10:00:00.000Z') }]
    });
    expect(slots.map((slot) => DateTime.fromJSDate(slot, { zone: 'utc' }).toFormat('HH:mm'))).toEqual(['09:00', '10:00']);
  });

  it('applies day overrides and minimum notice', () => {
    const slots = generateSlots({
      ...baseInput,
      override: { type: 'custom', ranges: [{ startMin: 11 * 60, endMin: 12 * 60 }] },
      now: new Date('2030-01-07T09:15:00.000Z'),
      minNoticeHours: 2
    });
    expect(slots.map((slot) => DateTime.fromJSDate(slot, { zone: 'utc' }).toFormat('HH:mm'))).toEqual(['11:15', '11:30']);
    expect(generateSlots({ ...baseInput, override: { type: 'off', ranges: [] } })).toEqual([]);
  });

  it('skips nonexistent local start times during a daylight-saving transition', () => {
    const slots = generateSlots({
      ...baseInput,
      rules: [{ dayOfWeek: 0, startMin: 60, endMin: 4 * 60 }],
      date: '2030-03-10',
      timezone: 'America/New_York',
      now: new Date('2030-03-09T00:00:00.000Z'),
      service: { durationMin: 15, bufferAfterMin: 0 }
    });
    const localHours = slots.map((slot) => DateTime.fromJSDate(slot, { zone: 'utc' }).setZone('America/New_York').hour);
    expect(localHours).not.toContain(2);
    expect(localHours).toContain(3);
  });
});