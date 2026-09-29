import { useState } from 'react';
import { useBookingActions, useMyBookings, useSlots } from '../hooks/useResources.js';
import { DateTime } from 'luxon';
import { EmptyState, ErrorMessage, LoadingState } from '../components/States.jsx';

function RescheduleControl({ booking }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(DateTime.local().plus({ days: 1 }).toISODate());
  const [selectedSlot, setSelectedSlot] = useState('');
  const providerId = booking.providerId?._id;
  const serviceId = booking.serviceId?._id;
  const slots = useSlots(providerId, serviceId, date);
  const reschedule = useBookingActions().reschedule;

  return <>
    <button className="button button-quiet button-small" onClick={() => setOpen((value) => !value)}>{open ? 'Close' : 'Reschedule'}</button>
    {open && <div className="reschedule-panel">
      <label className="field-block">New date<input type="date" min={DateTime.local().toISODate()} value={date} onChange={(event) => { setDate(event.target.value); setSelectedSlot(''); }} /></label>
      {slots.isPending ? <LoadingState label="Finding times" /> : slots.isError ? <ErrorMessage error={slots.error} /> : slots.data?.length ? <div className="slot-grid">{slots.data.map((slot) => {
        const value = typeof slot === 'string' ? slot : slot.start;
        return <button type="button" className={`slot-button ${selectedSlot === value ? 'is-selected' : ''}`} key={value} onClick={() => setSelectedSlot(value)}>{DateTime.fromISO(value).toLocaleString(DateTime.TIME_SIMPLE)}</button>;
      })}</div> : <p className="muted">No times available on this date.</p>}
      {reschedule.error && <ErrorMessage error={reschedule.error} />}
      <button className="button button-primary button-small" disabled={!selectedSlot || reschedule.isPending} onClick={() => reschedule.mutate({ id: booking._id, providerId, start: selectedSlot })}>{reschedule.isPending ? 'Moving...' : 'Confirm new time'}</button>
    </div>}
  </>;
}

export function MyBookingsPage() {
  const query = useMyBookings();
  const actions = useBookingActions();
  const now = DateTime.local();
  const upcoming = query.data?.filter((booking) => booking.status === 'confirmed' && DateTime.fromISO(booking.start).toMillis() >= now.toMillis()) || [];
  const past = query.data?.filter((booking) => !upcoming.includes(booking)) || [];
  return (
    <section className="content-section">
      <div className="section-heading"><div><p className="eyebrow">Your calendar, at a glance</p><h1>My bookings</h1></div><span className="heading-aside">{upcoming.length.toString().padStart(2, '0')} <i>upcoming</i></span></div>
      {query.isPending ? <LoadingState label="Loading bookings" /> : query.isError ? <ErrorMessage error={query.error} /> : !query.data.length ? <EmptyState title="Your calendar is open">Your confirmed appointments will appear here.</EmptyState> : <>
        <h2 className="list-title">Coming up</h2>
        {upcoming.length ? <div className="booking-list">{upcoming.map((booking) => <article className="booking-row" key={booking._id}>
          <div className="booking-date"><strong>{DateTime.fromISO(booking.start).toFormat('dd')}</strong><span>{DateTime.fromISO(booking.start).toFormat('LLL')}</span></div>
          <div className="booking-details"><h3>{booking.serviceId?.name || 'Appointment'}</h3><p>{DateTime.fromISO(booking.start).toLocaleString(DateTime.TIME_SIMPLE)} · {booking.providerId?.userId?.name || 'Provider'}</p></div>
          <span className="status-label">Confirmed</span>
          <RescheduleControl booking={booking} />
          <button className="button button-quiet button-small" onClick={() => actions.cancel.mutate(booking._id)} disabled={actions.cancel.isPending}>Cancel</button>
        </article>)}</div> : <EmptyState title="No upcoming appointments">Pick a service to find your next time.</EmptyState>}
        {past.length > 0 && <><h2 className="list-title past-title">Past and cancelled</h2><div className="booking-list">{past.map((booking) => <article className="booking-row is-past" key={booking._id}><div className="booking-date"><strong>{DateTime.fromISO(booking.start).toFormat('dd')}</strong><span>{DateTime.fromISO(booking.start).toFormat('LLL')}</span></div><div className="booking-details"><h3>{booking.serviceId?.name || 'Appointment'}</h3><p>{booking.status.replace('_', ' ')}</p></div></article>)}</div></>}
        <ErrorMessage error={actions.cancel.error} />
      </>}
    </section>
  );
}