import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/resources.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const authQuery = useQuery({ queryKey: ['auth', 'me'], queryFn: authApi.me, retry: false });
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => queryClient.setQueryData(['auth', 'me'], user)
  });
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (user) => queryClient.setQueryData(['auth', 'me'], user)
  });
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => queryClient.setQueryData(['auth', 'me'], null)
  });

  return (
    <AuthContext.Provider value={{
      user: authQuery.data ?? null,
      loading: authQuery.isPending,
      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
      error: loginMutation.error || registerMutation.error,
      isSubmitting: loginMutation.isPending || registerMutation.isPending
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}