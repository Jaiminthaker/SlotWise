import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { servicesApi } from '../api/resources.js';
import { ErrorMessage, LoadingState } from '../components/States.jsx';

const serviceSchema = z.object({ name: z.string().trim().min(1, 'Add a service name'), durationMin: z.coerce.number().int().positive('Use a duration above zero'), bufferAfterMin: z.coerce.number().int().nonnegative() });

export function AdminServicesPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['services'], queryFn: servicesApi.list });
  const [actionError, setActionError] = useState(null);
  const form = useForm({ resolver: zodResolver(serviceSchema), defaultValues: { name: '', durationMin: 30, bufferAfterMin: 0 } });
  const create = useMutation({ mutationFn: servicesApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); form.reset({ name: '', durationMin: 30, bufferAfterMin: 0 }); } });
  const remove = useMutation({ mutationFn: servicesApi.remove, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }) });
  async function submit(data) {
    setActionError(null);
    try { await create.mutateAsync(data); } catch (error) { setActionError(error); }
  }
  async function archive(id) {
    setActionError(null);
    try { await remove.mutateAsync(id); } catch (error) { setActionError(error); }
  }
  return (
    <section className="content-section">
      <div className="section-heading"><div><p className="eyebrow">Admin workspace</p><h1>Services</h1><p className="section-copy">Shape the appointments customers can book.</p></div><span className="heading-aside">{query.data?.length ?? '—'} <i>active</i></span></div>
      <div className="admin-layout">
        <div className="admin-services">{query.isPending ? <LoadingState label="Loading services" /> : query.isError ? <ErrorMessage error={query.error} /> : query.data.map((service) => <article className="admin-service-row" key={service._id}><div><h2>{service.name}</h2><p>{service.durationMin} min · {service.bufferAfterMin} min buffer</p></div><button className="text-button" onClick={() => archive(service._id)}>Archive</button></article>)}</div>
        <form className="create-service" onSubmit={form.handleSubmit(submit)}><p className="eyebrow">New offering</p><h2>Add a service</h2>
          <label>Service name<input {...form.register('name')} placeholder="e.g. Introductory session" />{form.formState.errors.name && <small>{form.formState.errors.name.message}</small>}</label>
          <div className="number-fields"><label>Duration<input type="number" min="1" {...form.register('durationMin')} /><span className="input-unit">min</span></label><label>Buffer<input type="number" min="0" {...form.register('bufferAfterMin')} /><span className="input-unit">min</span></label></div>
          <ErrorMessage error={actionError} /><button className="button button-primary" disabled={create.isPending}>{create.isPending ? 'Adding...' : 'Add service'}<span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </section>
  );
}