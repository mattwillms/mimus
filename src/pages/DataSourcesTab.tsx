import { useEffect, useState } from 'react'
import { useFetchStatus, useTriggerFetch } from '@/api/admin'
import type { DataSourceStatus } from '@/types/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { statusBadge, timeAgo, fmt, STATUS_COLORS, HistoryTable } from '@/lib/data-source-utils'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'

// ── Source Card ───────────────────────────────────────────────────

function SourceCard({
  name,
  label,
  data,
  onTrigger,
  triggerPending,
  justTriggered,
}: {
  name: 'permapeople' | 'perenual'
  label: string
  data: DataSourceStatus
  onTrigger: (force_full: boolean) => void
  triggerPending: boolean
  justTriggered: boolean
}) {
  const [forceFull, setForceFull] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const run = data.latest_run
  const hasErrors = (run?.errors ?? 0) > 0
  const hasErrorDetail = !!run?.error_detail
  const showRunning = data.is_running || justTriggered
  const buttonDisabled = showRunning || triggerPending

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{label}</CardTitle>
        {showRunning ? (
          <Badge className={STATUS_COLORS.running}>
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
                {hasErrors ? (
                  <button
                    className="inline-flex items-center gap-0.5 text-destructive hover:underline"
                    onClick={() => hasErrorDetail && setErrorOpen(!errorOpen)}
                  >
                    {fmt(run.errors)} errors
                    {hasErrorDetail &&
                      (errorOpen ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      ))}
                  </button>
                ) : (
                  <span>Errors: {fmt(run.errors)}</span>
                )}
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

        {/* Error detail (expandable) */}
        {errorOpen && run?.error_detail && (
          <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs text-destructive">
            {run.error_detail}
          </pre>
        )}

        {/* Error detail for Perenual (run status failed) */}
        {name === 'perenual' && run?.status === 'failed' && run.error_detail && (
          <p className="text-xs text-destructive">{run.error_detail}</p>
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
            disabled={buttonDisabled}
            onClick={() => onTrigger(name === 'permapeople' ? forceFull : false)}
          >
            {triggerPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Queued...
              </>
            ) : showRunning ? (
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
                disabled={buttonDisabled}
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
                disabled={buttonDisabled}
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

// ── Tab ──────────────────────────────────────────────────────────

export function DataSourcesTab() {
  const [pollInterval, setPollInterval] = useState(10_000)
  const { data: status, isLoading, isError } = useFetchStatus(pollInterval)
  const trigger = useTriggerFetch()
  const [justTriggered, setJustTriggered] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (status?.permapeople.is_running && justTriggered.permapeople)
      setJustTriggered((prev) => ({ ...prev, permapeople: false }))
    if (status?.perenual.is_running && justTriggered.perenual)
      setJustTriggered((prev) => ({ ...prev, perenual: false }))
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const anyRunning =
    status?.permapeople.is_running || status?.perenual.is_running ||
    justTriggered.permapeople || justTriggered.perenual
  if (anyRunning && pollInterval !== 5_000) setPollInterval(5_000)
  if (!anyRunning && pollInterval !== 10_000) setPollInterval(10_000)

  const handleTrigger = (source: 'permapeople' | 'perenual', forceFull: boolean) => {
    trigger.mutate({ source, force_full: forceFull })
    setJustTriggered((prev) => ({ ...prev, [source]: true }))
    setTimeout(() => {
      setJustTriggered((prev) => ({ ...prev, [source]: false }))
    }, 5_000)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (isError) return <p className="text-sm text-destructive">Failed to load data source status.</p>
  if (!status) return null

  return (
    <>
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Data Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {status.plants_total != null
            ? `${fmt(status.plants_total)} canonical species`
            : 'Plant data pipeline status'}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SourceCard
          name="permapeople"
          label="Permapeople"
          data={status.permapeople}
          onTrigger={(ff) => handleTrigger('permapeople', ff)}
          triggerPending={trigger.isPending}
          justTriggered={!!justTriggered.permapeople}
        />
        <SourceCard
          name="perenual"
          label="Perenual"
          data={status.perenual}
          onTrigger={() => handleTrigger('perenual', false)}
          triggerPending={trigger.isPending}
          justTriggered={!!justTriggered.perenual}
        />
      </div>
      <HistoryTable
        refetchInterval={anyRunning ? 5_000 : undefined}
        showSourceFilter={true}
      />
    </>
  )
}
