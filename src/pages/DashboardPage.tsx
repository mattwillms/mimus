import { Link } from 'react-router'
import { Server, Database, Zap, Cpu, Leaf, RefreshCw, Sparkles, Users, Sprout, TreePine } from 'lucide-react'
import { useHealth, useGardenAnalytics, useFetchStatus, usePlantCoverage } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DataSourceRun } from '@/types/admin'

function StatusDot({ color }: { color: 'green' | 'yellow' | 'red' }) {
  const classes = {
    green: 'bg-green-500',
    yellow: 'bg-amber-400',
    red: 'bg-red-500',
  }
  return (
    <span className={`h-2.5 w-2.5 rounded-full ${classes[color]} shrink-0`} />
  )
}

function healthDotColor(status: 'ok' | 'error'): 'green' | 'red' {
  return status === 'ok' ? 'green' : 'red'
}

function workerDotColor(status: string): 'green' | 'yellow' | 'red' {
  if (status === 'completed' || status === 'running') return 'green'
  if (status === 'failed') return 'red'
  return 'yellow'
}

function RunStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 hover:bg-green-100',
    running: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    failed: 'bg-red-100 text-red-800 hover:bg-red-100',
    budget_reached: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  }
  return (
    <Badge className={styles[status] ?? 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
      {status === 'budget_reached' ? 'Budget Reached' : status}
    </Badge>
  )
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const d = Math.floor(hr / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

export function DashboardPage() {
  const health = useHealth()
  const gardens = useGardenAnalytics()
  const fetchStatus = useFetchStatus()
  const coverage = usePlantCoverage()

  const isLoading = health.isLoading || gardens.isLoading || fetchStatus.isLoading || coverage.isLoading
  const isError = health.isError || gardens.isError || fetchStatus.isError || coverage.isError

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isError || !health.data || !gardens.data || !fetchStatus.data || !coverage.data) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-destructive">Failed to load dashboard data.</p>
        </div>
      </div>
    )
  }

  const h = health.data
  const g = gardens.data
  const fs = fetchStatus.data
  const cv = coverage.data

  // Avg coverage
  const avgCoverage = cv.fields.length > 0
    ? (cv.fields.reduce((sum, f) => sum + f.pct, 0) / cv.fields.length).toFixed(1)
    : '0.0'

  // Most recent fetch run
  const ppRun = fs.permapeople.latest_run
  const prRun = fs.perenual.latest_run
  let lastFetch: { source: string; run: DataSourceRun } | null = null
  if (ppRun && prRun) {
    lastFetch = new Date(ppRun.started_at) >= new Date(prRun.started_at)
      ? { source: 'permapeople', run: ppRun }
      : { source: 'perenual', run: prRun }
  } else if (ppRun) {
    lastFetch = { source: 'permapeople', run: ppRun }
  } else if (prRun) {
    lastFetch = { source: 'perenual', run: prRun }
  }

  const enrichRun = fs.enrichment.latest_run

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">System overview</p>
      </div>

      {/* Row 1 — System Health */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">API</span>
            </div>
            <StatusDot color={healthDotColor(h.api)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Database</span>
            </div>
            <StatusDot color={healthDotColor(h.db)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Redis</span>
            </div>
            <StatusDot color={healthDotColor(h.redis)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Worker</span>
            </div>
            <StatusDot color={workerDotColor(h.worker.last_run_status)} />
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — Plant DB */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Plant Database</CardTitle>
          </div>
          <Link to="/plant-data" className="text-xs text-muted-foreground hover:text-foreground">
            View details &rarr;
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <div>
              <p className="text-2xl font-semibold">{cv.total_plants.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total plants</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{avgCoverage}%</p>
              <p className="text-xs text-muted-foreground">Avg coverage</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">Perenual: {fmt(fs.perenual.total_records)}</Badge>
              <Badge variant="outline" className="text-xs">Permapeople: {fmt(fs.permapeople.total_records)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 3 — Recent Activity */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Last Fetch</CardTitle>
            </div>
            <Link to="/data-sources" className="text-xs text-muted-foreground hover:text-foreground">
              View history &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            {lastFetch ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">{lastFetch.source}</Badge>
                  <RunStatusBadge status={lastFetch.run.status} />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Synced: {fmt(lastFetch.source === 'perenual' ? lastFetch.run.records_synced : lastFetch.run.new_species)}</span>
                  <span>{timeAgo(lastFetch.run.started_at)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No fetch runs yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Last Enrichment</CardTitle>
            </div>
            <Link to="/plant-data" className="text-xs text-muted-foreground hover:text-foreground">
              View rules &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            {enrichRun ? (
              <div className="space-y-1.5">
                <RunStatusBadge status={enrichRun.status} />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Fields populated: {fmt(enrichRun.updated)}</span>
                  <span>{timeAgo(enrichRun.started_at)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No enrichment run yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Garden Activity */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Users</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{g.totals.users}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sprout className="h-4 w-4" />
              <span className="text-xs font-medium">Gardens</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{g.totals.gardens}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TreePine className="h-4 w-4" />
              <span className="text-xs font-medium">Active Plantings</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">{g.totals.active_plantings}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
