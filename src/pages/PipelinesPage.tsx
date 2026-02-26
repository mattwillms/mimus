import { useState, useEffect, useRef } from 'react'
import { usePipelineRuns } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function timeAgo(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-800 hover:bg-green-100',
  failed: 'bg-red-100 text-red-800 hover:bg-red-100',
  running: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  skipped: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function PipelinesPage() {
  const [page, setPage] = useState(1)
  const [pipelineNameInput, setPipelineNameInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedName = useDebounce(pipelineNameInput, 300)
  const prevNameRef = useRef(debouncedName)

  useEffect(() => {
    if (prevNameRef.current !== debouncedName) {
      setPage(1)
      prevNameRef.current = debouncedName
    }
  }, [debouncedName])

  const params = {
    ...(debouncedName ? { pipeline_name: debouncedName } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    page,
  }

  const { data, isLoading, isError } = usePipelineRuns(params)
  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Pipelines</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} total runs` : 'Background job execution log'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Filter by pipeline name…"
            value={pipelineNameInput}
            onChange={(e) => {
              setPipelineNameInput(e.target.value)
              setPage(1)
            }}
            className="w-64"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {isError && <p className="text-sm text-destructive">Failed to load pipeline runs.</p>}

        {data && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pipeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No pipeline runs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((run) => {
                      const errorText = run.error_message ?? ''
                      const truncated = errorText.length > 60
                      const preview = truncated ? errorText.slice(0, 60) + '…' : errorText

                      return (
                        <TableRow key={run.id}>
                          <TableCell className="font-mono text-xs font-medium">
                            {run.pipeline_name}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[run.status] ?? STATUS_COLORS.skipped}>
                              {run.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {timeAgo(run.started_at)}
                          </TableCell>
                          <TableCell>{formatDuration(run.duration_ms)}</TableCell>
                          <TableCell>{run.records_processed ?? '—'}</TableCell>
                          <TableCell className="max-w-[200px]">
                            {errorText ? (
                              truncated ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-default text-xs text-destructive">
                                      {preview}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm whitespace-pre-wrap text-xs">
                                    {errorText}
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-xs text-destructive">{errorText}</span>
                              )
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
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
    </TooltipProvider>
  )
}
