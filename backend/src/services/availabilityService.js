import { AvailabilityRule } from '../models/AvailabilityRule.js';
import { DayOverride } from '../models/DayOverride.js';
import { Provider } from '../models/Provider.js';
import { AppError } from '../utils/errors.js';

export async function getMyProvider(userId) {
  const provider = await Provider.findOne({ userId });
  if (!provider) throw new AppError(404, 'NOT_FOUND', 'Provider profile not found');
  return provider;
}

export async function replaceAvailability(userId, rules) {
  const provider = await getMyProvider(userId);
  await AvailabilityRule.deleteMany({ providerId: provider.id });
  return AvailabilityRule.insertMany(rules.map((rule) => ({ ...rule, providerId: provider.id })));
}

export async function addOverride(userId, override) {
  const provider = await getMyProvider(userId);
  return DayOverride.findOneAndUpdate(
    { providerId: provider.id, date: override.date },
    { ...override, providerId: provider.id },
    { upsert: true, new: true, runValidators: true }
  );
}