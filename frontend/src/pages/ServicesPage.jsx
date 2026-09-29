import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useResources.js';
import { EmptyState, ErrorMessage, LoadingState } from '../components/States.jsx';

export function ServicesPage() {
  const query = useServices();
  return (
    <section className="content-section">
      <div className="section-heading">
        <div><p className="eyebrow">Find your time</p><h1>Choose a service</h1><p className="section-copy">A clear next step, at a time that suits you.</p></div>
        <span className="heading-aside">01 <i>/</i> 04</span>
      </div>
      {query.isPending ? <LoadingState label="Loading services" /> : query.isError ? <ErrorMessage error={query.error} /> : query.data.length === 0 ? <EmptyState title="Nothing on the schedule yet">Check back soon for available services.</EmptyState> : (
        <div className="service-list">{query.data.map((service, index) => (
          <article className="service-row" key={service._id}>
            <span className="service-index">0{index + 1}</span>
            <div className="service-info"><h2>{service.name}</h2><span>{service.durationMin} min{service.bufferAfterMin ? ` · ${service.bufferAfterMin} min reset` : ''}</span></div>
            <Link className="button button-outline" to={`/book?service=${service._id}`}>Find a time <span aria-hidden="true">↗</span></Link>
          </article>
        ))}</div>
      )}
    </section>
  );
}