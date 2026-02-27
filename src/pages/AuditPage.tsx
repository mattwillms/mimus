import { useState } from 'react'
import { useAuditLog } from '@/api/admin'
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

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800 hover:bg-green-100',
  update: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  delete: 'bg-red-100 text-red-700 hover:bg-red-100',
  login: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  export: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
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

const PER_PAGE = 50

export function AuditPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('all')
  const [entityTypeInput, setEntityTypeInput] = useState('')

  const params = {
    ...(actionFilter !== 'all' ? { action: actionFilter } : {}),
    ...(entityTypeInput.trim() ? { entity_type: entityTypeInput.trim() } : {}),
    page,
    per_page: PER_PAGE,
  }

  const { data, isLoading, isError } = useAuditLog(params)
  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Audit Trail</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} total entries` : 'Record of all system actions'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by entity type…"
            value={entityTypeInput}
            onChange={(e) => {
              setEntityTypeInput(e.target.value)
              setPage(1)
            }}
            className="w-56"
          />
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {isError && <p className="text-sm text-destructive">Failed to load audit log.</p>}

        {data && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        No audit entries yet — audit logging will populate as actions are recorded.
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
                              ACTION_COLORS[entry.action] ??
                              'bg-gray-100 text-gray-700 hover:bg-gray-100'
                            }
                          >
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.entity_type ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.entity_id ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.user_email ?? (entry.user_id ? `#${entry.user_id}` : '—')}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {entry.ip_address ?? '—'}
                        </TableCell>
                        <TableCell>
                          {entry.details ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="text-xs text-primary underline-offset-2 hover:underline">
                                  View
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="left"
                                className="max-w-sm"
                              >
                                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs">
                                  {JSON.stringify(entry.details, null, 2)}
                                </pre>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
    </TooltipProvider>
  )
}
