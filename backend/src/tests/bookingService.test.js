import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createBooking, cancelBooking, rescheduleBooking } from '../services/bookingService.js';
import { User } from '../models/User.js';
import { Service } from '../models/Service.js';
import { Provider } from '../models/Provider.js';
import { AvailabilityRule } from '../models/AvailabilityRule.js';
import { Booking } from '../models/Booking.js';
import { SlotLock } from '../models/SlotLock.js';

describe('bookingService', () => {
  let mongod;
  let providerUser;
  let customerUser;
  let customer2User;
  let provider;
  let service;

  beforeAll(async () => {
    try {
      mongod = await MongoMemoryServer.create({
        instance: { launchTimeout: 60000 }
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
    } catch (err) {
      console.warn('MongoMemoryServer failed to start:', err.message);
    }
  }, 90000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();

    customerUser = await User.create({
      name: 'Customer Alice',
      email: 'alice@example.com',
      passwordHash: 'hash123',
      role: 'customer'
    });

    customer2User = await User.create({
      name: 'Customer Bob',
      email: 'bob@example.com',
      passwordHash: 'hash123',
      role: 'customer'
    });

    providerUser = await User.create({
      name: 'Dr. Smith',
      email: 'smith@example.com',
      passwordHash: 'hash123',
      role: 'provider'
    });

    service = await Service.create({
      name: 'Consultation',
      durationMin: 30,
      bufferAfterMin: 15,
      active: true
    });

    provider = await Provider.create({
      userId: providerUser._id,
      serviceIds: [service._id],
      timezone: 'UTC'
    });

    // Provider works Monday (1) to Friday (5) from 09:00 (540 min) to 17:00 (1020 min)
    for (let day = 0; day <= 6; day++) {
      await AvailabilityRule.create({
        providerId: provider._id,
        dayOfWeek: day,
        startMin: 540,
        endMin: 1020
      });
    }
  });

  it('creates bookings with slot locks', async () => {
    // 2 days in the future at 10:00 UTC (600 min, multiple of 15)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    futureDate.setUTCHours(10, 0, 0, 0);

    const booking = await createBooking({
      providerId: provider._id.toString(),
      customerId: customerUser._id.toString(),
      serviceId: service._id.toString(),
      start: futureDate
    });

    expect(booking).toBeDefined();
    expect(booking.status).toBe('confirmed');
    expect(new Date(booking.start).toISOString()).toBe(futureDate.toISOString());

    // Service duration 30 min + 15 min buffer = 45 min = 3 15-min units
    const expectedEnd = new Date(futureDate.getTime() + 45 * 60 * 1000);
    expect(new Date(booking.end).toISOString()).toBe(expectedEnd.toISOString());

    const locks = await SlotLock.find({ bookingId: booking._id }).sort({ unitStart: 1 });
    expect(locks.length).toBe(3);
    expect(new Date(locks[0].unitStart).toISOString()).toBe(futureDate.toISOString());
    expect(new Date(locks[1].unitStart).toISOString()).toBe(new Date(futureDate.getTime() + 15 * 60 * 1000).toISOString());
    expect(new Date(locks[2].unitStart).toISOString()).toBe(new Date(futureDate.getTime() + 30 * 60 * 1000).toISOString());
  });

  it('prevents double-booking when the slot is already taken', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    futureDate.setUTCHours(10, 0, 0, 0);

    await createBooking({
      providerId: provider._id.toString(),
      customerId: customerUser._id.toString(),
      serviceId: service._id.toString(),
      start: futureDate
    });

    // Attempt to book overlapping time by another customer
    await expect(
      createBooking({
        providerId: provider._id.toString(),
        customerId: customer2User._id.toString(),
        serviceId: service._id.toString(),
        start: new Date(futureDate.getTime() + 15 * 60 * 1000)
      })
    ).rejects.toMatchObject({
      status: 409,
      code: 'SLOT_TAKEN'
    });
  });

  it('cancels bookings and releases slot locks', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setUTCHours(10, 0, 0, 0);

    const booking = await createBooking({
      providerId: provider._id.toString(),
      customerId: customerUser._id.toString(),
      serviceId: service._id.toString(),
      start: futureDate
    });

    const cancelled = await cancelBooking({
      bookingId: booking._id.toString(),
      actor: customerUser
    });

    expect(cancelled.status).toBe('cancelled');

    // Slot locks should be released
    const locks = await SlotLock.find({ bookingId: booking._id });
    expect(locks.length).toBe(0);

    // Another customer can now book this slot
    const newBooking = await createBooking({
      providerId: provider._id.toString(),
      customerId: customer2User._id.toString(),
      serviceId: service._id.toString(),
      start: futureDate
    });
    expect(newBooking.status).toBe('confirmed');
  });

  it('reschedules bookings atomically', async () => {
    const initialDate = new Date();
    initialDate.setDate(initialDate.getDate() + 3);
    initialDate.setUTCHours(10, 0, 0, 0);

    const booking = await createBooking({
      providerId: provider._id.toString(),
      customerId: customerUser._id.toString(),
      serviceId: service._id.toString(),
      start: initialDate
    });

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 4);
    targetDate.setUTCHours(14, 0, 0, 0);

    const rescheduled = await rescheduleBooking({
      bookingId: booking._id.toString(),
      customerId: customerUser._id.toString(),
      providerId: provider._id.toString(),
      start: targetDate
    });

    expect(rescheduled.status).toBe('confirmed');
    expect(new Date(rescheduled.start).toISOString()).toBe(targetDate.toISOString());

    // Old slot locks should be removed and new ones created
    const oldLocks = await SlotLock.find({ bookingId: booking._id, unitStart: initialDate });
    expect(oldLocks.length).toBe(0);

    const newLocks = await SlotLock.find({ bookingId: booking._id }).sort({ unitStart: 1 });
    expect(newLocks.length).toBe(3);
    expect(new Date(newLocks[0].unitStart).toISOString()).toBe(targetDate.toISOString());
  });
});