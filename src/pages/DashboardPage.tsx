import { useHealth } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function StatusBadge({ status }: { status: 'ok' | 'error' }) {
  if (status === 'ok') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Operational
      </Badge>
    )
  }
  return <Badge variant="destructive">Error</Badge>
}

function WorkerStatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Completed
      </Badge>
    )
  }
  if (status === 'running') {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        Running
      </Badge>
    )
  }
  if (status === 'quota_reached') {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        Quota Reached
      </Badge>
    )
  }
  if (status === 'failed') {
    return <Badge variant="destructive">Failed</Badge>
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Unknown</Badge>
  )
}

export function DashboardPage() {
  const { data, isLoading, isError } = useHealth()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading system status…</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-destructive">Failed to load system status.</p>
        </div>
      </div>
    )
  }

  const workerRunAt = data.worker.last_run_at
    ? new Date(data.worker.last_run_at).toLocaleString()
    : '—'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">System health — refreshes every 30s</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">API</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={data.api} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={data.db} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Redis</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={data.redis} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Worker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <WorkerStatusBadge status={data.worker.last_run_status} />
            <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <dt>Last run</dt>
                <dd>{workerRunAt}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Records synced</dt>
                <dd>{data.worker.records_synced ?? '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
