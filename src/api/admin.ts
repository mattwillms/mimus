import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { AdminUserListResponse, HealthStatus } from '@/types/admin'

export function useHealth() {
  return useQuery<HealthStatus>({
    queryKey: ['admin', 'health'],
    queryFn: async () => {
      const { data } = await apiClient.get<HealthStatus>('/admin/health')
      return data
    },
    refetchInterval: 30000,
  })
}

export function useAdminUsers(page: number, perPage: number) {
  return useQuery<AdminUserListResponse>({
    queryKey: ['admin', 'users', page, perPage],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminUserListResponse>('/admin/users', {
        params: { page, per_page: perPage },
      })
      return data
    },
  })
}
