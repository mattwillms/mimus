export interface HealthStatus {
  api: 'ok' | 'error'
  db: 'ok' | 'error'
  redis: 'ok' | 'error'
  worker: {
    last_run_status: 'completed' | 'failed' | 'running' | 'quota_reached' | 'unknown'
    last_run_at: string | null
    records_synced: number | null
  }
}

export interface AdminUser {
  id: number
  first_name: string
  last_name: string | null
  email: string
  role: string
  is_active: boolean
  timezone: string | null
  zip_code: string | null
  hardiness_zone: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  last_login: string | null
}

export interface AdminUserCreate {
  first_name: string
  last_name?: string
  email: string
  password: string
  role: string
  is_active: boolean
  timezone?: string
  zip_code?: string
  hardiness_zone?: string
  latitude?: number
  longitude?: number
}

export interface AdminUserUpdate {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  role?: string
  is_active?: boolean
  timezone?: string
  zip_code?: string
  hardiness_zone?: string
  latitude?: number
  longitude?: number
}

export interface AdminUserListResponse {
  items: AdminUser[]
  total: number
  page: number
  per_page: number
}

export interface PipelineRun {
  id: number
  pipeline_name: string
  status: 'running' | 'success' | 'failed' | 'skipped'
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  records_processed: number | null
  error_message: string | null
}

export interface PipelineRunListResponse {
  items: PipelineRun[]
  total: number
  page: number
  per_page: number
}

export interface NotificationLogEntry {
  id: number
  user_id: number
  user_email: string
  notification_type: string
  channel: string
  status: string
  timestamp: string
  message_preview: string | null
}

export interface NotificationLogResponse {
  items: NotificationLogEntry[]
  total: number
  page: number
  per_page: number
}

export interface WeatherRecord {
  date: string
  high_temp_f: number | null
  low_temp_f: number | null
  precip_inches: number | null
  humidity_pct: number | null
  frost_warning: boolean
}

export interface WeatherAnalyticsResponse {
  summary: {
    avg_high_f: number | null
    avg_low_f: number | null
    total_precip_inches: number | null
    frost_days: number
  }
  records: WeatherRecord[]
}

export interface GardenAnalytics {
  totals: {
    users: number
    gardens: number
    beds: number
    active_plantings: number
  }
  plantings_by_status: { status: string; count: number }[]
  top_plants: { plant_id: number; common_name: string; count: number }[]
}

export interface ApiRequestLogEntry {
  id: number
  timestamp: string
  method: string
  endpoint: string
  user_id: number | null
  status_code: number
  latency_ms: number
  ip_address: string | null
}

export interface ApiRequestLogResponse {
  items: ApiRequestLogEntry[]
  total: number
  page: number
  per_page: number
}

export interface AuditLogEntry {
  id: number
  timestamp: string
  action: string
  entity_type: string | null
  entity_id: number | null
  user_id: number | null
  user_email: string | null
  ip_address: string | null
  details: Record<string, unknown> | null
}

export interface AuditLogResponse {
  items: AuditLogEntry[]
  total: number
  page: number
  per_page: number
}

// ── Data Sources ─────────────────────────────────────────────────

export interface DataSourceRun {
  id: number
  source?: string
  status: string
  started_at: string
  finished_at: string | null
  new_species?: number | null
  updated?: number | null
  gap_filled?: number | null
  unchanged?: number | null
  skipped?: number | null
  errors?: number | null
  triggered_by?: string
  // Perenual-specific (from SeederRun)
  current_page?: number | null
  records_synced?: number | null
  requests_used?: number | null
}

export interface DataSourceStatus {
  latest_run: DataSourceRun | null
  total_records: number
  matched_to_plants: number
  is_running: boolean
}

export interface FetchStatusResponse {
  permapeople: DataSourceStatus
  perenual: DataSourceStatus
  plants_total: number
}

export interface FetchHistoryResponse {
  items: DataSourceRun[]
  total: number
  page: number
  per_page: number
}
