import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type {
  AdminPlantBrowseParams,
  AdminPlantListResponse,
  AdminUser,
  AdminUserCreate,
  AdminUserListResponse,
  AdminUserUpdate,
  ApiRequestLogResponse,
  AuditLogResponse,
  EnrichmentRule,
  EnrichmentRuleUpdate,
  EnrichmentRulesResponse,
  FetchHistoryResponse,
  FetchStatusResponse,
  GardenAnalytics,
  HealthStatus,
  NotificationLogResponse,
  PipelineRunListResponse,
  PlantCoverageResponse,
  PlantSourcesResponse,
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

// ── Data Sources ─────────────────────────────────────────────────

export function useFetchStatus(refetchInterval = 10_000) {
  return useQuery<FetchStatusResponse>({
    queryKey: ['admin', 'fetch', 'status'],
    queryFn: () =>
      apiClient.get<FetchStatusResponse>('/admin/fetch/status').then((r) => r.data),
    refetchInterval,
  })
}

export function useFetchHistory(
  params: {
    source?: string
    page?: number
    per_page?: number
  },
  refetchInterval?: number,
) {
  return useQuery<FetchHistoryResponse>({
    queryKey: ['admin', 'fetch', 'history', params],
    queryFn: () =>
      apiClient
        .get<FetchHistoryResponse>('/admin/fetch/history', { params })
        .then((r) => r.data),
    refetchInterval,
  })
}

export function useTriggerFetch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { source: 'permapeople' | 'perenual'; force_full?: boolean }) => {
      const url = `/admin/fetch/${params.source}`
      const body =
        params.source === 'permapeople' ? { force_full: params.force_full ?? false } : undefined
      return apiClient.post(url, body).then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fetch', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'fetch', 'history'] })
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'fetch', 'status'] })
        queryClient.invalidateQueries({ queryKey: ['admin', 'fetch', 'history'] })
      }, 2_000)
    },
  })
}

// ── Plant Browser ────────────────────────────────────────────────

export function useAdminPlants(params: AdminPlantBrowseParams) {
  return useQuery<AdminPlantListResponse>({
    queryKey: ['admin', 'plants', params],
    queryFn: () =>
      apiClient
        .get<AdminPlantListResponse>('/admin/plants/browse', { params })
        .then((r) => r.data),
  })
}

export function useAdminPlantSources(plantId: number | null) {
  return useQuery<PlantSourcesResponse>({
    queryKey: ['admin', 'plants', plantId, 'sources'],
    queryFn: () =>
      apiClient
        .get<PlantSourcesResponse>(`/admin/plants/${plantId}/sources`)
        .then((r) => r.data),
    enabled: plantId !== null,
  })
}

// ── Coverage + Enrichment Rules ──────────────────────────────────

export function usePlantCoverage() {
  return useQuery<PlantCoverageResponse>({
    queryKey: ['admin', 'plants', 'coverage'],
    queryFn: () =>
      apiClient.get<PlantCoverageResponse>('/admin/plants/coverage').then((r) => r.data),
  })
}

export function useEnrichmentRules() {
  return useQuery<EnrichmentRulesResponse>({
    queryKey: ['admin', 'enrichment', 'rules'],
    queryFn: () =>
      apiClient.get<EnrichmentRulesResponse>('/admin/enrichment/rules').then((r) => r.data),
  })
}

export function useUpdateEnrichmentRule() {
  const queryClient = useQueryClient()
  return useMutation<EnrichmentRule, Error, { field_name: string; data: EnrichmentRuleUpdate }>({
    mutationFn: ({ field_name, data }) =>
      apiClient
        .patch<EnrichmentRule>(`/admin/enrichment/rules/${field_name}`, data)
        .then((r) => r.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrichment', 'rules'] }),
  })
}

// ── Triggers ─────────────────────────────────────────────────────

export function useTriggerEnrichment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.post('/admin/enrich').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fetch', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'fetch', 'history'] })
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'fetch', 'status'] })
        queryClient.invalidateQueries({ queryKey: ['admin', 'fetch', 'history'] })
      }, 2_000)
    },
  })
}
