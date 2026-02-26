import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type {
  AdminUserListResponse,
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
