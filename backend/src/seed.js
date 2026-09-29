import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { User } from './models/User.js';
import { Service } from './models/Service.js';
import { Provider } from './models/Provider.js';

try {
  await connectDb();
  const passwordHash = await bcrypt.hash('ChangeThis123!', 12);
  const [admin, providerOne, providerTwo] = await Promise.all([
    User.findOneAndUpdate({ email: 'admin@slotwise.local' }, { name: 'SlotWise Admin', passwordHash, role: 'admin' }, { upsert: true, new: true }),
    User.findOneAndUpdate({ email: 'provider1@slotwise.local' }, { name: 'Jordan Lee', passwordHash, role: 'provider' }, { upsert: true, new: true }),
    User.findOneAndUpdate({ email: 'provider2@slotwise.local' }, { name: 'Avery Chen', passwordHash, role: 'provider' }, { upsert: true, new: true })
  ]);
  const serviceOne = await Service.findOneAndUpdate({ name: 'Consultation' }, { name: 'Consultation', durationMin: 45, bufferAfterMin: 15, active: true }, { upsert: true, new: true });
  const serviceTwo = await Service.findOneAndUpdate({ name: 'Follow-up' }, { name: 'Follow-up', durationMin: 30, bufferAfterMin: 0, active: true }, { upsert: true, new: true });
  await Promise.all([
    Provider.findOneAndUpdate({ userId: providerOne.id }, { userId: providerOne.id, serviceIds: [serviceOne.id, serviceTwo.id], timezone: 'America/New_York' }, { upsert: true }),
    Provider.findOneAndUpdate({ userId: providerTwo.id }, { userId: providerTwo.id, serviceIds: [serviceOne.id], timezone: 'Europe/London' }, { upsert: true })
  ]);
  console.log(`Seeded admin ${admin.email}; demo password: ChangeThis123!`);
} finally {
  await mongoose.disconnect();
}