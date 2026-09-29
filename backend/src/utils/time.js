import { DateTime } from 'luxon';

export function localDateTimeToUtc(date, minuteOfDay, timezone) {
  return DateTime.fromISO(date, { zone: timezone })
    .startOf('day')
    .plus({ minutes: minuteOfDay })
    .toUTC()
    .toJSDate();
}

export function isValidTimezone(timezone) {
  return DateTime.now().setZone(timezone).isValid;
}