import { useState } from 'react'
import { useFetchStatus, useFetchHistory, useTriggerFetch } from '@/api/admin'
import type { DataSourceStatus, DataSourceRun } from '@/types/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2 } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  budget_reached: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
}

const STATUS_LABELS: Record<string, string> = {
  budget_reached: 'Budget Reached',
}

function statusBadge(status: string | undefined) {
  if (!status) return null
  const label = STATUS_LABELS[status] ?? status
  return (
    <Badge className={STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}>
      {label}
    </Badge>
  )
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

function formatDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

// ── Source Card ───────────────────────────────────────────────────

function SourceCard({
  name,
  label,
  data,
  onTrigger,
  triggerPending,
}: {
  name: 'permapeople' | 'perenual'
  label: string
  data: DataSourceStatus
  onTrigger: (force_full: boolean) => void
  triggerPending: boolean
}) {
  const [forceFull, setForceFull] = useState(false)
  const run = data.latest_run

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{label}</CardTitle>
        {data.is_running ? (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Running
          </Badge>
        ) : (
          statusBadge(run?.status)
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total records</p>
            <p className="text-lg font-semibold">{fmt(data.total_records)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Matched</p>
            <p className="text-lg font-semibold">{fmt(data.matched_to_plants)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last run</p>
            <p className="text-lg font-semibold">{timeAgo(run?.started_at)}</p>
          </div>
        </div>

        {/* Last run summary */}
        {run && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {name === 'permapeople' ? (
              <>
                <span>New: {fmt(run.new_species)}</span>
                <span>Updated: {fmt(run.updated)}</span>
                <span>Gaps: {fmt(run.gap_filled)}</span>
                <span>Errors: {fmt(run.errors)}</span>
              </>
            ) : (
              <>
                <span>Synced: {fmt(run.records_synced)}</span>
                <span>Page: {fmt(run.current_page)}</span>
                <span>Requests: {fmt(run.requests_used)}</span>
              </>
            )}
          </div>
        )}

        {/* Budget note for Perenual */}
        {name === 'perenual' && run?.status === 'budget_reached' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Daily limit reached (95/100 requests) — resumes tomorrow
          </p>
        )}

        {/* Trigger */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            disabled={data.is_running || triggerPending}
            onClick={() => onTrigger(name === 'permapeople' ? forceFull : false)}
          >
            {data.is_running ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Running...
              </>
            ) : (
              'Run Fetch'
            )}
          </Button>
          {name === 'permapeople' && (
            <div className="inline-flex rounded-md border border-border text-xs">
              <button
                className={cn(
                  'px-3 py-1.5 rounded-l-md transition-colors',
                  !forceFull
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
                disabled={data.is_running}
                onClick={() => setForceFull(false)}
              >
                Update
              </button>
              <button
                className={cn(
                  'px-3 py-1.5 rounded-r-md transition-colors border-l border-border',
                  forceFull
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
                disabled={data.is_running}
                onClick={() => setForceFull(true)}
              >
                Full
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── History Table ────────────────────────────────────────────────

function HistoryTable() {
  const [sourceFilter, setSourceFilter] = useState('all')
  const [page, setPage] = useState(1)

  const params = {
    ...(sourceFilter !== 'all' ? { source: sourceFilter } : {}),
    page,
    per_page: 20,
  }

  const { data, isLoading } = useFetchHistory(params)
  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Run History</h2>
        <Select
          value={sourceFilter}
          onValueChange={(v) => {
            setSourceFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="permapeople">Permapeople</SelectItem>
            <SelectItem value="perenual">Perenual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {data && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Gaps</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Triggered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No fetch runs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((run) => (
                    <HistoryRow key={`${run.source}-${run.id}`} run={run} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function HistoryRow({ run }: { run: DataSourceRun }) {
  // For perenual, show records_synced under "New" and current_page as tooltip
  const isPerenual = run.source === 'perenual'

  const newCol = isPerenual ? run.records_synced : run.new_species
  const updatedCol = isPerenual ? null : run.updated
  const gapCol = isPerenual ? null : run.gap_filled

  return (
    <TooltipProvider>
      <TableRow>
        <TableCell className="font-mono text-xs font-medium capitalize">
          {run.source}
        </TableCell>
        <TableCell>{statusBadge(run.status)}</TableCell>
        <TableCell className="text-muted-foreground">{timeAgo(run.started_at)}</TableCell>
        <TableCell>{formatDuration(run.started_at, run.finished_at)}</TableCell>
        <TableCell>
          {isPerenual && run.current_page != null ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default">{fmt(newCol)}</span>
              </TooltipTrigger>
              <TooltipContent>Page {run.current_page}</TooltipContent>
            </Tooltip>
          ) : (
            fmt(newCol)
          )}
        </TableCell>
        <TableCell>{fmt(updatedCol)}</TableCell>
        <TableCell>{fmt(gapCol)}</TableCell>
        <TableCell>
          {(run.errors ?? 0) > 0 ? (
            <span className="text-destructive">{fmt(run.errors)}</span>
          ) : (
            fmt(run.errors)
          )}
        </TableCell>
        <TableCell className="text-muted-foreground">{run.triggered_by ?? '—'}</TableCell>
      </TableRow>
    </TooltipProvider>
  )
}

// ── Page ─────────────────────────────────────────────────────────

export function DataSourcesPage() {
  const [pollInterval, setPollInterval] = useState(10_000)
  const { data: status, isLoading, isError } = useFetchStatus(pollInterval)
  const trigger = useTriggerFetch()

  // Dynamic polling: 5s when running, 10s when idle
  const anyRunning = status?.permapeople.is_running || status?.perenual.is_running
  if (anyRunning && pollInterval !== 5_000) setPollInterval(5_000)
  if (!anyRunning && pollInterval !== 10_000) setPollInterval(10_000)

  const handleTrigger = (source: 'permapeople' | 'perenual', forceFull: boolean) => {
    trigger.mutate({ source, force_full: forceFull })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Data Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {status
            ? `${status.plants_total.toLocaleString()} canonical species`
            : 'Plant data pipeline status'}
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && (
        <p className="text-sm text-destructive">Failed to load data source status.</p>
      )}

      {status && (
        <div className="grid gap-4 md:grid-cols-2">
          <SourceCard
            name="permapeople"
            label="Permapeople"
            data={status.permapeople}
            onTrigger={(ff) => handleTrigger('permapeople', ff)}
            triggerPending={trigger.isPending}
          />
          <SourceCard
            name="perenual"
            label="Perenual"
            data={status.perenual}
            onTrigger={() => handleTrigger('perenual', false)}
            triggerPending={trigger.isPending}
          />
        </div>
      )}

      <HistoryTable />
    </div>
  )
}
