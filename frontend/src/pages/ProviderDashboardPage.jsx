import { useState } from 'react';
import { DateTime } from 'luxon';
import { useProviderBookings } from '../hooks/useResources.js';
import { EmptyState, ErrorMessage, LoadingState } from '../components/States.jsx';

export function ProviderDashboardPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = DateTime.local().startOf('week').plus({ weeks: weekOffset });
  const from = weekStart.toUTC().toISO();
  const to = weekStart.plus({ weeks: 1 }).toUTC().toISO();
  const query = useProviderBookings(from, to);
  const days = Array.from({ length: 7 }, (_, index) => weekStart.plus({ days: index }));
  return (
    <section className="content-section">
      <div className="section-heading"><div><p className="eyebrow">Provider workspace</p><h1>Your week</h1><p className="section-copy">A calm view of what's on the calendar.</p></div><div className="week-controls"><button className="icon-button" aria-label="Previous week" onClick={() => setWeekOffset((value) => value - 1)}>←</button><span>{weekStart.toFormat('LLL d')} — {weekStart.plus({ days: 6 }).toFormat('LLL d')}</span><button className="icon-button" aria-label="Next week" onClick={() => setWeekOffset((value) => value + 1)}>→</button></div></div>
      {query.isPending ? <LoadingState label="Loading calendar" /> : query.isError ? <ErrorMessage error={query.error} /> : <div className="week-grid">
        {days.map((day) => {
          const events = query.data.filter((booking) => DateTime.fromISO(booking.start).hasSame(day, 'day'));
          return <section className={`day-column ${day.hasSame(DateTime.local(), 'day') ? 'today' : ''}`} key={day.toISODate()}><div className="day-heading"><span>{day.toFormat('ccc')}</span><strong>{day.toFormat('d')}</strong></div>
            {events.length ? events.map((event) => <article className="calendar-event" key={event._id}><time>{DateTime.fromISO(event.start).toFormat('t')}</time><strong>{event.serviceId?.name}</strong><span>{event.customerId?.name}</span></article>) : <span className="day-empty">—</span>}
          </section>;
        })}
      </div>}
      {query.data?.length === 0 && <EmptyState title="A clear week">No appointments in this date range.</EmptyState>}
    </section>
  );
}