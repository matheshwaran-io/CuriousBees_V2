import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useFollowStatus(userId: string) {
  return useQuery({
    queryKey: ['followStatus', userId],
    queryFn: async () => {
      if (!userId) return null;
      return apiFetch(`/api/users/${userId}/follow-status`);
    },
    enabled: !!userId,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return apiFetch(`/api/users/${userId}/follow`, { method: 'POST' });
    },
    onSuccess: (_, userId) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['followStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['researchers'] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return apiFetch(`/api/users/${userId}/follow`, { method: 'DELETE' });
    },
    onSuccess: (_, userId) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['followStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['researchers'] });
    },
  });
}

export function useToggleFollowNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, enabled }: { userId: string; enabled: boolean }) => {
      return apiFetch(`/api/users/${userId}/follow-notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['followStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['researchers'] });
    },
  });
}
