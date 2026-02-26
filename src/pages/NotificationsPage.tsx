import { useState } from 'react'
import { useNotificationLog } from '@/api/admin'
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

const TYPE_COLORS: Record<string, string> = {
  frost: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
  heat: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  water: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  fertilize: 'bg-green-100 text-green-800 hover:bg-green-100',
  spray: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  harvest: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  custom: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-green-100 text-green-800 hover:bg-green-100',
  failed: 'bg-red-100 text-red-800 hover:bg-red-100',
  delivered: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
}

export function NotificationsPage() {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const params = {
    ...(typeFilter !== 'all' ? { notification_type: typeFilter } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    page,
  }

  const { data, isLoading, isError } = useNotificationLog(params)
  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `${data.total} total entries` : 'Notification delivery log'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="frost">Frost</SelectItem>
            <SelectItem value="heat">Heat</SelectItem>
            <SelectItem value="water">Water</SelectItem>
            <SelectItem value="fertilize">Fertilize</SelectItem>
            <SelectItem value="spray">Spray</SelectItem>
            <SelectItem value="harvest">Harvest</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

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
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load notifications.</p>}

      {data && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No notifications logged.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((entry) => {
                    const preview = entry.message_preview
                      ? entry.message_preview.length > 80
                        ? entry.message_preview.slice(0, 80) + '…'
                        : entry.message_preview
                      : '—'

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">{entry.user_email}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              TYPE_COLORS[entry.notification_type] ?? TYPE_COLORS.custom
                            }
                          >
                            {entry.notification_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.channel}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={STATUS_COLORS[entry.status] ?? STATUS_COLORS.sent}
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                          {preview}
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
  )
}
