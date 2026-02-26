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
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string | null
  hardiness_zone: string | null
  zip_code: string | null
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
