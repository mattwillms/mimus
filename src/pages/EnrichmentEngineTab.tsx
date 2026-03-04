import { useEffect, useState } from 'react'
import {
  useFetchStatus,
  useTriggerEnrichment,
  useEnrichmentRules,
  useUpdateEnrichmentRule,
} from '@/api/admin'
import type { EnrichmentStatus } from '@/types/admin'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { statusBadge, timeAgo, fmt, STATUS_COLORS, HistoryTable } from '@/lib/data-source-utils'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'

// ── Enrichment Card ──────────────────────────────────────────────

function EnrichmentCard({
  data,
  onTrigger,
  triggerPending,
  justTriggered,
}: {
  data: EnrichmentStatus
  onTrigger: () => void
  triggerPending: boolean
  justTriggered: boolean
}) {
  const [errorOpen, setErrorOpen] = useState(false)
  const run = data.latest_run
  const hasErrors = (run?.errors ?? 0) > 0
  const hasErrorDetail = !!run?.error_detail
  const showRunning = data.is_running || justTriggered
  const buttonDisabled = showRunning || triggerPending

  const hasUnmapped = run?.error_detail?.includes('Unmapped') ?? false

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Enrichment Engine</CardTitle>
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
            <p className="text-muted-foreground">Plants enriched</p>
            <p className="text-lg font-semibold">{fmt(run?.new_species)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fields updated</p>
            <p className="text-lg font-semibold">{fmt(run?.updated)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last run</p>
            <p className="text-lg font-semibold">{timeAgo(run?.started_at)}</p>
          </div>
        </div>

        {/* Error / unmapped summary */}
        {run && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Unchanged: {fmt(run.unchanged)}</span>
            <span>Skipped: {fmt(run.skipped)}</span>
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
          </div>
        )}

        {/* Expandable error detail */}
        {errorOpen && run?.error_detail && (
          <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs text-destructive">
            {run.error_detail}
          </pre>
        )}

        {/* Unmapped values warning */}
        {!errorOpen && hasUnmapped && !hasErrors && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Some source values could not be mapped — expand errors for details
          </p>
        )}

        {/* Trigger */}
        <Button
          size="sm"
          disabled={buttonDisabled}
          onClick={onTrigger}
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
            'Run Enrichment'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Enrichment Rules Table ───────────────────────────────────────

function EnrichmentRulesTable() {
  const { data: rulesData, isLoading } = useEnrichmentRules()
  const updateRule = useUpdateEnrichmentRule()

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading rules...</p>
  if (!rulesData) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Enrichment Rules</h2>
        <p className="text-sm text-muted-foreground">{rulesData.items.length} rules configured</p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Field</TableHead>
              <TableHead className="w-[160px]">Strategy</TableHead>
              <TableHead>Source Priority</TableHead>
              <TableHead className="w-[120px]">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rulesData.items.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-mono text-xs">{rule.field_name}</TableCell>
                <TableCell>
                  <Select
                    value={rule.strategy}
                    onValueChange={(v) =>
                      updateRule.mutate({ field_name: rule.field_name, data: { strategy: v } })
                    }
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">priority</SelectItem>
                      <SelectItem value="union">union</SelectItem>
                      <SelectItem value="longest">longest</SelectItem>
                      <SelectItem value="average">average</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {rule.source_priority ? (
                    <div className="flex flex-wrap gap-1">
                      {rule.source_priority.map((src) => (
                        <Badge key={src} variant="outline" className="px-1.5 py-0 text-[10px]">
                          {src}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {timeAgo(rule.updated_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ── Tab ──────────────────────────────────────────────────────────

export function EnrichmentEngineTab() {
  const [pollInterval, setPollInterval] = useState(10_000)
  const { data: status, isLoading, isError } = useFetchStatus(pollInterval)
  const trigger = useTriggerEnrichment()
  const [justTriggered, setJustTriggered] = useState(false)

  useEffect(() => {
    if (status?.enrichment.is_running && justTriggered)
      setJustTriggered(false)
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const isRunning = status?.enrichment.is_running || justTriggered
  if (isRunning && pollInterval !== 5_000) setPollInterval(5_000)
  if (!isRunning && pollInterval !== 10_000) setPollInterval(10_000)

  const handleTrigger = () => {
    trigger.mutate()
    setJustTriggered(true)
    setTimeout(() => setJustTriggered(false), 5_000)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (isError) return <p className="text-sm text-destructive">Failed to load data source status.</p>
  if (!status) return null

  return (
    <>
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Enrichment Engine</h1>
        <p className="mt-1 text-sm text-muted-foreground">Field-level enrichment rules and run history</p>
      </div>
      <EnrichmentCard
        data={status.enrichment}
        onTrigger={handleTrigger}
        triggerPending={trigger.isPending}
        justTriggered={justTriggered}
      />
      <HistoryTable
        refetchInterval={isRunning ? 5_000 : undefined}
        sourceFilter="enrichment"
        showSourceFilter={false}
      />
      <EnrichmentRulesTable />
    </>
  )
}
