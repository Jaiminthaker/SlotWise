import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, providersApi, servicesApi } from '../api/resources.js';

export function useServices() {
  return useQuery({ queryKey: ['services'], queryFn: servicesApi.list });
}

export function useProviders(serviceId) {
  return useQuery({ queryKey: ['providers', serviceId], queryFn: () => providersApi.list(serviceId), enabled: Boolean(serviceId) });
}

export function useSlots(providerId, serviceId, date) {
  return useQuery({
    queryKey: ['slots', providerId, serviceId, date],
    queryFn: () => providersApi.slots({ id: providerId, serviceId, date }),
    enabled: Boolean(providerId && serviceId && date)
  });
}

export function useMyBookings() {
  return useQuery({ queryKey: ['bookings', 'mine'], queryFn: bookingsApi.mine });
}

export function useBookingActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['bookings'] });
  return {
    cancel: useMutation({ mutationFn: bookingsApi.cancel, onSuccess: refresh }),
    reschedule: useMutation({ mutationFn: bookingsApi.reschedule, onSuccess: refresh }),
    create: useMutation({ mutationFn: bookingsApi.create, onSuccess: refresh })
  };
}

export function useProviderBookings(from, to) {
  return useQuery({ queryKey: ['providerBookings', from, to], queryFn: () => providersApi.bookings({ from, to }), enabled: Boolean(from && to) });
}

export function useSaveAvailability() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: providersApi.saveAvailability, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['providerBookings'] }) });
}