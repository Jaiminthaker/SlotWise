import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { useBookingActions, useProviders, useServices, useSlots } from '../hooks/useResources.js';
import { EmptyState, ErrorMessage, LoadingState } from '../components/States.jsx';

export function BookSlotPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [serviceId, setServiceId] = useState(params.get('service') || '');
  const [providerId, setProviderId] = useState('');
  const [date, setDate] = useState(DateTime.local().toISODate());
  const [selectedSlot, setSelectedSlot] = useState('');
  const services = useServices();
  const providers = useProviders(serviceId);
  const slots = useSlots(providerId, serviceId, date);
  const booking = useBookingActions().create;

  async function confirmBooking() {
    await booking.mutateAsync({ providerId, serviceId, start: selectedSlot });
    navigate('/bookings', { replace: true });
  }

  return (
    <section className="content-section">
      <div className="section-heading"><div><p className="eyebrow">Make it yours</p><h1>Book a time</h1><p className="section-copy">Times are shown in your local timezone.</p></div><span className="heading-aside">02 <i>/</i> 04</span></div>
      <div className="booking-steps">
        <label className="field-block">Service<select value={serviceId} onChange={(event) => { setServiceId(event.target.value); setProviderId(''); setSelectedSlot(''); }}><option value="">Choose a service</option>{services.data?.map((service) => <option value={service._id} key={service._id}>{service.name} · {service.durationMin} min</option>)}</select></label>
        <label className="field-block">Provider<select value={providerId} disabled={!serviceId || providers.isPending} onChange={(event) => { setProviderId(event.target.value); setSelectedSlot(''); }}><option value="">Choose a provider</option>{providers.data?.map((provider) => <option value={provider._id} key={provider._id}>{provider.userId?.name || 'Provider'}</option>)}</select></label>
        <label className="field-block">Date<input type="date" min={DateTime.local().toISODate()} value={date} onChange={(event) => { setDate(event.target.value); setSelectedSlot(''); }} /></label>
      </div>
      <ErrorMessage error={services.error || providers.error || slots.error || booking.error} />
      <div className="slots-section">
        <div className="subheading"><div><p className="eyebrow">Your local time</p><h2>{date ? DateTime.fromISO(date).toFormat('cccc, LLLL d') : 'Select a date'}</h2></div>{providerId && <span className="timezone-tag">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>}</div>
        {slots.isPending && providerId ? <LoadingState label="Finding open times" /> : !providerId ? <EmptyState title="Start with a provider">Choose a service and provider to see available times.</EmptyState> : slots.data?.length ? <div className="slot-grid">{slots.data.map((slot) => {
          const value = typeof slot === 'string' ? slot : slot.start;
          return <button className={`slot-button ${selectedSlot === value ? 'is-selected' : ''}`} key={value} onClick={() => setSelectedSlot(value)}>{DateTime.fromISO(value).toLocaleString(DateTime.TIME_SIMPLE)}</button>;
        })}</div> : <EmptyState title="No open times on this date">Try another day or provider.</EmptyState>}
      </div>
      {selectedSlot && <div className="booking-confirm"><div><span className="eyebrow">Selected time</span><strong>{DateTime.fromISO(selectedSlot).toLocaleString(DateTime.DATETIME_MED)}</strong></div><button className="button button-primary" onClick={confirmBooking} disabled={booking.isPending}>{booking.isPending ? 'Confirming...' : 'Confirm booking'}<span aria-hidden="true">↗</span></button></div>}
    </section>
  );
}