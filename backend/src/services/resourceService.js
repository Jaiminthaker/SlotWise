import { Service } from '../models/Service.js';
import { Provider } from '../models/Provider.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { isValidTimezone } from '../utils/time.js';

export const listServices = () => Service.find({ active: true }).sort({ name: 1 });
export const createService = (data) => Service.create(data);

export async function updateService(id, data) {
  const service = await Service.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!service) throw new AppError(404, 'NOT_FOUND', 'Service not found');
  return service;
}

export async function deleteService(id) {
  const service = await Service.findByIdAndUpdate(id, { active: false }, { new: true });
  if (!service) throw new AppError(404, 'NOT_FOUND', 'Service not found');
  return service;
}

export function listProviders(serviceId) {
  return Provider.find(serviceId ? { serviceIds: serviceId } : {}).populate('userId', 'name').populate('serviceIds', 'name durationMin');
}

export async function createProvider(data) {
  const user = await User.findById(data.userId);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  if (user.role !== 'provider') {
    user.role = 'provider';
    await user.save();
  }
  if (!isValidTimezone(data.timezone)) throw new AppError(422, 'VALIDATION_ERROR', 'Invalid IANA timezone');
  return Provider.create(data);
}