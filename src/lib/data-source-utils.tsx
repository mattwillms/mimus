/**
 * Shared helpers and sub-components for the Data Sources tabs.
 */
import { useState } from 'react'
import { useFetchHistory } from '@/api/admin'
import type { DataSourceRun } from '@/types/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ChevronDown, ChevronRight } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  budget_reached: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
}

const STATUS_LABELS: Record<string, string> = {
  budget_reached: 'Budget Reached',
}

export function statusBadge(status: string | undefined) {
  if (!status) return null
  const normalized = status === 'complete' ? 'completed' : status
  const label = STATUS_LABELS[normalized] ?? normalized
  return (
    <Badge className={STATUS_COLORS[normalized] ?? 'bg-gray-100 text-gray-600'}>
      {label}
    </Badge>
  )
}

export function timeAgo(iso: string | null | undefined): string {
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

export function formatDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

export function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

// ── History Table ────────────────────────────────────────────────

function HistoryRow({ run }: { run: DataSourceRun }) {
  const [errorOpen, setErrorOpen] = useState(false)
  const isPerenual = run.source === 'perenual'
  const isEnrichment = run.source === 'enrichment'
  const isImageCache = run.source === 'image_cache'

  const newCol = isPerenual ? run.records_synced : run.new_species
  const updatedCol = isPerenual ? null : run.updated
  const gapCol = isPerenual || isEnrichment || isImageCache ? null : run.gap_filled
  const hasErrors = (run.errors ?? 0) > 0
  const hasErrorDetail = !!run.error_detail

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs font-medium capitalize">
          {run.source === 'image_cache' ? 'image cache' : run.source}
        </TableCell>
        <TableCell>{statusBadge(run.status)}</TableCell>
        <TableCell className="text-muted-foreground">{timeAgo(run.started_at)}</TableCell>
        <TableCell>{formatDuration(run.started_at, run.finished_at)}</TableCell>
        <TableCell>
          {isPerenual && run.current_page != null ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">{fmt(newCol)}</span>
                </TooltipTrigger>
                <TooltipContent>Page {run.current_page}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            fmt(newCol)
          )}
        </TableCell>
        <TableCell>{fmt(updatedCol)}</TableCell>
        <TableCell>{fmt(gapCol)}</TableCell>
        <TableCell>
          {hasErrors ? (
            <button
              className="inline-flex items-center gap-0.5 text-destructive hover:underline"
              onClick={() => hasErrorDetail && setErrorOpen(!errorOpen)}
            >
              {fmt(run.errors)}
              {hasErrorDetail &&
                (errorOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                ))}
            </button>
          ) : (
            fmt(run.errors)
          )}
        </TableCell>
        <TableCell className="text-muted-foreground">{run.triggered_by ?? '—'}</TableCell>
      </TableRow>
      {errorOpen && run.error_detail && (
        <TableRow>
          <TableCell colSpan={9} className="p-0">
            <pre className="max-h-40 overflow-auto bg-muted p-2 text-xs text-destructive">
              {run.error_detail}
            </pre>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

const FETCH_SOURCES = ['permapeople', 'perenual']

export function HistoryTable({
  refetchInterval,
  sourceFilter: fixedSource,
  showSourceFilter = true,
  restrictToFetchSources = false,
}: {
  refetchInterval?: number
  sourceFilter?: string
  showSourceFilter?: boolean
  restrictToFetchSources?: boolean
}) {
  const [sourceFilter, setSourceFilter] = useState(fixedSource ?? 'all')
  const [page, setPage] = useState(1)

  const activeSource = fixedSource ?? (sourceFilter !== 'all' ? sourceFilter : undefined)

  const params = {
    ...(activeSource ? { source: activeSource } : {}),
    page,
    per_page: 20,
  }

  const { data: rawData, isLoading } = useFetchHistory(params, refetchInterval)

  // When restricted to fetch sources and no specific filter is active,
  // drop enrichment/image_cache rows client-side
  const data = rawData && restrictToFetchSources && !activeSource
    ? { ...rawData, items: rawData.items.filter((r) => r.source && FETCH_SOURCES.includes(r.source)) }
    : rawData
  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Run History</h2>
        {showSourceFilter && !fixedSource && (
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
              {!restrictToFetchSources && (
                <>
                  <SelectItem value="enrichment">Enrichment</SelectItem>
                  <SelectItem value="image_cache">Image Cache</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        )}
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
