import { useState, useEffect } from 'react'
import { useCronJobs, useUpdateCronJob, useRestartWorker } from '@/api/admin'
import type { CronJob } from '@/types/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, RotateCw, Check, AlertTriangle } from 'lucide-react'

const JOB_LABELS: Record<string, string> = {
  cache_images: 'Image Cache',
  fetch_perenual: 'Perenual Fetch',
  fetch_permapeople: 'Permapeople Fetch',
  refresh_hardiness_zones: 'Hardiness Zones',
  send_daily_digest: 'Daily Digest',
  send_frost_alerts: 'Frost Alerts',
  send_heat_alerts: 'Heat Alerts',
  sync_admin_weather: 'Admin Weather Sync',
  sync_weather: 'Weather Sync',
}

type LocalEdits = Record<string, Partial<Pick<CronJob, 'enabled' | 'hour' | 'minute' | 'interval_hours'>>>

function nextRunCentral(job: CronJob & Partial<Pick<CronJob, 'enabled' | 'hour' | 'minute' | 'interval_hours'>>): string {
  if (!job.enabled) return '—'

  const now = new Date()
  const utcH = now.getUTCHours()
  const utcM = now.getUTCMinutes()
  const minute = job.minute ?? 0

  let nextUtc: Date

  if (job.interval_hours) {
    const hours = []
    for (let h = 0; h < 24; h += job.interval_hours) hours.push(h)
    const nextHour = hours.find((h) => h > utcH || (h === utcH && minute > utcM))
    if (nextHour !== undefined) {
      nextUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), nextHour, minute))
    } else {
      nextUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, hours[0], minute))
    }
  } else if (job.hour != null) {
    if (job.hour > utcH || (job.hour === utcH && minute > utcM)) {
      nextUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), job.hour, minute))
    } else {
      nextUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, job.hour, minute))
    }
  } else {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(nextUtc)
}

function JobRow({
  job,
  edits,
  onEdit,
  onSave,
  saving,
}: {
  job: CronJob
  edits: Partial<Pick<CronJob, 'enabled' | 'hour' | 'minute' | 'interval_hours'>> | undefined
  onEdit: (field: string, value: unknown) => void
  onSave: () => void
  saving: boolean
}) {
  const current = { ...job, ...edits }
  const hasChanges = !!edits && Object.keys(edits).length > 0
  const isInterval = current.interval_hours != null

  return (
    <TableRow className={hasChanges ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
      <TableCell className="font-medium">
        {JOB_LABELS[job.name] ?? job.name}
        <span className="ml-2 font-mono text-xs text-muted-foreground">{job.name}</span>
      </TableCell>
      <TableCell>
        <Switch
          checked={current.enabled}
          onCheckedChange={(v) => onEdit('enabled', v)}
        />
      </TableCell>
      <TableCell>
        {isInterval ? (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Every</span>
            <Input
              type="number"
              min={1}
              max={12}
              className="h-8 w-16 text-center"
              value={current.interval_hours ?? ''}
              onChange={(e) => onEdit('interval_hours', e.target.value ? Number(e.target.value) : null)}
            />
            <span className="text-muted-foreground">h at :</span>
            <Input
              type="number"
              min={0}
              max={59}
              className="h-8 w-16 text-center"
              value={current.minute ?? 0}
              onChange={(e) => onEdit('minute', Number(e.target.value))}
            />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm">
            <Input
              type="number"
              min={0}
              max={23}
              className="h-8 w-16 text-center"
              value={current.hour ?? ''}
              onChange={(e) => onEdit('hour', e.target.value ? Number(e.target.value) : null)}
            />
            <span className="text-muted-foreground">:</span>
            <Input
              type="number"
              min={0}
              max={59}
              className="h-8 w-16 text-center"
              value={current.minute ?? 0}
              onChange={(e) => onEdit('minute', Number(e.target.value))}
            />
            <span className="text-muted-foreground">UTC</span>
          </div>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {nextRunCentral(current)}
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          disabled={!hasChanges || saving}
          onClick={onSave}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function ScheduledJobsTab() {
  const { data, isLoading, isError } = useCronJobs()
  const updateJob = useUpdateCronJob()
  const restartWorker = useRestartWorker()
  const [edits, setEdits] = useState<LocalEdits>({})
  const [savingJob, setSavingJob] = useState<string | null>(null)
  const [restartState, setRestartState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  // Reset restart state after 3s
  useEffect(() => {
    if (restartState === 'success' || restartState === 'error') {
      const t = setTimeout(() => setRestartState('idle'), 3_000)
      return () => clearTimeout(t)
    }
  }, [restartState])

  function handleEdit(name: string, field: string, value: unknown) {
    setEdits((prev) => ({
      ...prev,
      [name]: { ...prev[name], [field]: value },
    }))
  }

  async function handleSave(name: string) {
    const changes = edits[name]
    if (!changes) return
    setSavingJob(name)
    try {
      await updateJob.mutateAsync({ name, body: changes })
      setEdits((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    } finally {
      setSavingJob(null)
    }
  }

  function handleRestart() {
    setRestartState('pending')
    restartWorker.mutate(undefined, {
      onSuccess: () => setRestartState('success'),
      onError: () => setRestartState('error'),
    })
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (isError) return <p className="text-sm text-destructive">Failed to load cron jobs.</p>
  if (!data) return null

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Scheduled Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cron schedule for background tasks — changes require a worker restart.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            disabled={restartState === 'pending'}
          >
            {restartState === 'pending' ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Restarting...
              </>
            ) : restartState === 'success' ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                Restarted
              </>
            ) : restartState === 'error' ? (
              <>
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5 text-destructive" />
                Failed
              </>
            ) : (
              <>
                <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                Restart Worker
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead className="w-20">Enabled</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Next Run (Central)</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((job) => (
              <JobRow
                key={job.name}
                job={job}
                edits={edits[job.name]}
                onEdit={(field, value) => handleEdit(job.name, field, value)}
                onSave={() => handleSave(job.name)}
                saving={savingJob === job.name}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
