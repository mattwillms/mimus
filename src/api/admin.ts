import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type {
  AdminUser,
  AdminUserCreate,
  AdminUserListResponse,
  AdminUserUpdate,
  ApiRequestLogResponse,
  AuditLogResponse,
  GardenAnalytics,
  HealthStatus,
  NotificationLogResponse,
  PipelineRunListResponse,
  WeatherAnalyticsResponse,
} from '@/types/admin'

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

export function useCreateAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminUserCreate) =>
      apiClient.post<AdminUser>('/admin/users', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useUpdateAdminUser(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminUserUpdate) =>
      apiClient.patch<AdminUser>(`/admin/users/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function usePipelineRuns(params: { pipeline_name?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'pipelines', params],
    queryFn: () =>
      apiClient.get<PipelineRunListResponse>('/admin/pipelines', { params }).then((r) => r.data),
    refetchInterval: 30_000,
  })
}

export function useNotificationLog(params: {
  notification_type?: string
  status?: string
  page?: number
}) {
  return useQuery({
    queryKey: ['admin', 'notifications', params],
    queryFn: () =>
      apiClient
        .get<NotificationLogResponse>('/admin/notifications/log', { params })
        .then((r) => r.data),
  })
}

export function useWeatherAnalytics(days: number) {
  return useQuery({
    queryKey: ['admin', 'weather', days],
    queryFn: () =>
      apiClient
        .get<WeatherAnalyticsResponse>('/admin/analytics/weather', { params: { days } })
        .then((r) => r.data),
  })
}

export function useGardenAnalytics() {
  return useQuery<GardenAnalytics>({
    queryKey: ['admin', 'analytics', 'gardens'],
    queryFn: () =>
      apiClient.get<GardenAnalytics>('/admin/analytics/gardens').then((r) => r.data),
  })
}

export function useApiLogs(params: { endpoint?: string; status_class?: number; page?: number }) {
  return useQuery<ApiRequestLogResponse>({
    queryKey: ['admin', 'logs', params],
    queryFn: () =>
      apiClient.get<ApiRequestLogResponse>('/admin/logs', { params }).then((r) => r.data),
    refetchInterval: 30_000,
  })
}

export function useAuditLog(params: {
  action?: string
  entity_type?: string
  user_id?: number
  page?: number
}) {
  return useQuery<AuditLogResponse>({
    queryKey: ['admin', 'audit', params],
    queryFn: () =>
      apiClient.get<AuditLogResponse>('/admin/audit', { params }).then((r) => r.data),
  })
}
