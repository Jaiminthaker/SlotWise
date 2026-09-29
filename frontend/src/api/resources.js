import { api } from './client.js';

export const authApi = {
  me: async () => (await api.get('/auth/me')).data.user,
  login: async (data) => (await api.post('/auth/login', data)).data.user,
  register: async (data) => (await api.post('/auth/register', data)).data.user,
  logout: async () => api.post('/auth/logout'),
  requestPasswordReset: async (email) => (await api.post('/auth/forgot-password', { email })).data,
  resetPassword: async (data) => (await api.post('/auth/reset-password', data)).data
};

export const servicesApi = {
  list: async () => (await api.get('/services')).data.services,
  create: async (data) => (await api.post('/admin/services', data)).data.service,
  update: async ({ id, ...data }) => (await api.patch(`/admin/services/${id}`, data)).data.service,
  remove: async (id) => (await api.delete(`/admin/services/${id}`)).data.service
};

export const providersApi = {
  list: async (serviceId) => (await api.get('/providers', { params: serviceId ? { serviceId } : {} })).data.providers,
  slots: async ({ id, serviceId, date }) => (await api.get(`/providers/${id}/slots`, { params: { serviceId, date } })).data.slots,
  saveAvailability: async (rules) => (await api.put('/providers/me/availability', { rules })).data.rules,
  addOverride: async (data) => (await api.post('/providers/me/overrides', data)).data.override,
  bookings: async ({ from, to }) => (await api.get('/providers/me/bookings', { params: { from, to } })).data.bookings
};

export const bookingsApi = {
  create: async (data) => (await api.post('/bookings', data)).data.booking,
  mine: async () => (await api.get('/bookings/me')).data.bookings,
  cancel: async (id) => (await api.patch(`/bookings/${id}/cancel`)).data.booking,
  reschedule: async ({ id, ...data }) => (await api.post(`/bookings/${id}/reschedule`, data)).data.booking
};