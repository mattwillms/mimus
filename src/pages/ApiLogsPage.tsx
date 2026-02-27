import { useState, useEffect, useRef } from 'react'
import { useApiLogs } from '@/api/admin'
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
import { cn } from '@/lib/utils'

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  POST: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  PATCH: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  PUT: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  DELETE: 'bg-red-100 text-red-700 hover:bg-red-100',
}

function statusBadgeClass(code: number): string {
  if (code >= 500) return 'bg-red-100 text-red-700 hover:bg-red-100'
  if (code >= 400) return 'bg-amber-100 text-amber-800 hover:bg-amber-100'
  return 'bg-green-100 text-green-800 hover:bg-green-100'
}

function latencyClass(ms: number): string {
  if (ms > 500) return 'text-red-600'
  if (ms >= 100) return 'text-amber-600'
  return 'text-green-600'
}

function formatTs(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const PER_PAGE = 50

export function ApiLogsPage() {
  const [page, setPage] = useState(1)
  const [endpointInput, setEndpointInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedEndpoint = useDebounce(endpointInput, 300)
  const prevEndpointRef = useRef(debouncedEndpoint)

  useEffect(() => {
    if (prevEndpointRef.current !== debouncedEndpoint) {
      setPage(1)
      prevEndpointRef.current = debouncedEndpoint
    }
  }, [debouncedEndpoint])

  const params = {
    ...(debouncedEndpoint ? { endpoint: debouncedEndpoint } : {}),
    ...(statusFilter !== 'all' ? { status_class: Number(statusFilter) } : {}),
    page,
    per_page: PER_PAGE,
  }

  const { data, isLoading, isError } = useApiLogs(params)
  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">API Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `${data.total.toLocaleString()} total requests` : 'Live API request log'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Filter by endpoint…"
          value={endpointInput}
          onChange={(e) => {
            setEndpointInput(e.target.value)
            setPage(1)
          }}
          className="w-72"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="2">2xx</SelectItem>
            <SelectItem value="4">4xx</SelectItem>
            <SelectItem value="5">5xx</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load API logs.</p>}

      {data && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No log entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatTs(entry.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            METHOD_COLORS[entry.method] ?? 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                          }
                        >
                          {entry.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate font-mono text-xs">
                        {entry.endpoint}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(entry.status_code)}>
                          {entry.status_code}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn('text-xs font-medium', latencyClass(entry.latency_ms))}
                      >
                        {entry.latency_ms}ms
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.user_id ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {entry.ip_address ?? '—'}
                      </TableCell>
                    </TableRow>
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
