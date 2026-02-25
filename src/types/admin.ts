export interface HealthStatus {
  api: 'ok' | 'error'
  db: 'ok' | 'error'
  redis: 'ok' | 'error'
  worker: {
    last_run_status: 'completed' | 'failed' | 'running' | 'unknown'
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
