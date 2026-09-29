import { DateTime } from 'luxon';
import { isOverlapping } from '../utils/overlap.js';

function localTimeAtMinute(day, minute, timezone) {
  const date = day.plus({ days: Math.floor(minute / 1440) });
  const minuteOfDay = minute % 1440;
  const result = DateTime.fromObject({
    year: date.year,
    month: date.month,
    day: date.day,
    hour: Math.floor(minuteOfDay / 60),
    minute: minuteOfDay % 60
  }, { zone: timezone });

  if (!result.isValid || result.toISODate() !== date.toISODate() || result.hour !== Math.floor(minuteOfDay / 60) || result.minute !== minuteOfDay % 60) {
    return null;
  }
  return result;
}

/**
 * Computes bookable start times for a provider and local calendar date.
 * @param {{ rules: Array, override: object|null, bookings: Array, service: object, date: string, timezone: string, now: Date }} input Slot inputs.
 * @returns {Array<Date>} Available slot start instants in UTC.
 */
export function generateSlots({ rules, override, bookings, service, date, timezone, now, slotUnitMin = 15, minNoticeHours = 2 }) {
  const day = DateTime.fromISO(date, { zone: timezone });
  if (!day.isValid || day.toISODate() !== date || !Number.isInteger(slotUnitMin) || slotUnitMin <= 0) return [];

  const ranges = override
    ? override.type === 'off' ? [] : override.ranges ?? []
    : rules.filter((rule) => rule.dayOfWeek === day.weekday % 7);
  const durationMin = Number(service.durationMin) + Number(service.bufferAfterMin ?? 0);
  if (!Number.isFinite(durationMin) || durationMin <= 0) return [];

  const earliestStart = new Date(now).getTime() + minNoticeHours * 60 * 60 * 1000;
  const availableSlots = new Map();

  for (const range of ranges) {
    if (!Number.isInteger(range.startMin) || !Number.isInteger(range.endMin) || range.startMin < 0 || range.endMin > 1440 || range.endMin <= range.startMin) continue;

    const rangeEnd = localTimeAtMinute(day, range.endMin, timezone);
    if (!rangeEnd) continue;

    const firstStart = Math.ceil(range.startMin / slotUnitMin) * slotUnitMin;
    for (let minute = firstStart; minute < range.endMin; minute += slotUnitMin) {
      const localStart = localTimeAtMinute(day, minute, timezone);
      if (!localStart) continue;

      const start = localStart.toUTC().toJSDate();
      const end = new Date(start.getTime() + durationMin * 60_000);
      if (start.getTime() < earliestStart || end.getTime() > rangeEnd.toUTC().toMillis()) continue;
      if (bookings.some((booking) => isOverlapping({ start, end }, booking))) continue;

      availableSlots.set(start.getTime(), start);
    }
  }

  return [...availableSlots.values()].sort((a, b) => a.getTime() - b.getTime());
}