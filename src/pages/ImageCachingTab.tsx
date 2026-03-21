import { useEffect, useState } from 'react'
import { useFetchStatus, useTriggerImageCache, useImageCacheFailed } from '@/api/admin'
import type { ImageCacheStatus } from '@/types/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { statusBadge, timeAgo, fmt, STATUS_COLORS, HistoryTable } from '@/lib/data-source-utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'

// ── Image Cache Card ─────────────────────────────────────────────

function ImageCacheCard({
  data,
  onTrigger,
  triggerPending,
  justTriggered,
}: {
  data: ImageCacheStatus
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

  const totalCached = data.cached_on_disk
  const totalMissing = Math.max(0, data.plants_with_image - totalCached)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Image Cache</CardTitle>
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
            <p className="text-muted-foreground">Plants w/ image</p>
            <p className="text-lg font-semibold">{fmt(data.plants_with_image)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cached</p>
            <p className="text-lg font-semibold">{fmt(totalCached)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Missing</p>
            <p className="text-lg font-semibold">{fmt(totalMissing)}</p>
          </div>
        </div>

        {/* Last run summary */}
        {run && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Newly cached: {fmt(run.new_species)}</span>
            <span>Already cached: {fmt(run.skipped)}</span>
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
            <span>Last run: {timeAgo(run.started_at)}</span>
          </div>
        )}

        {/* Error detail (expandable) */}
        {errorOpen && run?.error_detail && (
          <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs text-destructive">
            {run.error_detail}
          </pre>
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
            'Run Image Cache'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Tab ──────────────────────────────────────────────────────────

export function ImageCachingTab() {
  const [pollInterval, setPollInterval] = useState(10_000)
  const { data: status, isLoading, isError } = useFetchStatus(pollInterval)
  const { data: failedData } = useImageCacheFailed()
  const trigger = useTriggerImageCache()
  const [justTriggered, setJustTriggered] = useState(false)

  useEffect(() => {
    if (status?.image_cache.is_running && justTriggered)
      setJustTriggered(false)
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const isRunning = status?.image_cache.is_running || justTriggered
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
        <h1 className="font-serif text-2xl font-semibold text-foreground">Image Caching</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {status.image_cache.plants_with_image != null
            ? `${fmt(status.image_cache.plants_with_image)} plants with images · ${fmt(status.image_cache.cached_on_disk)} cached on disk`
            : 'Plant image cache management'}
        </p>
      </div>
      <ImageCacheCard
        data={status.image_cache}
        onTrigger={handleTrigger}
        triggerPending={trigger.isPending}
        justTriggered={justTriggered}
      />
      {failedData && failedData.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Permanently Failed ({fmt(failedData.total)})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              These plants have image URLs that consistently fail to download. Their source data is
              preserved — if a future enrichment source provides a working image URL, these plants
              will automatically re-enter the cache queue.
            </p>
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Plant ID</TableHead>
                    <TableHead>Common Name</TableHead>
                    <TableHead>Scientific Name</TableHead>
                    <TableHead>Source URL</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedData.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.id}</TableCell>
                      <TableCell className="text-sm">{p.common_name}</TableCell>
                      <TableCell className="text-sm italic">{p.scientific_name ?? '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={p.image_url ?? undefined}>
                        {p.image_url ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[250px] text-xs text-muted-foreground">
                        {p.image_cache_failed_reason ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      <HistoryTable
        refetchInterval={isRunning ? 5_000 : undefined}
        sourceFilter="image_cache"
        showSourceFilter={false}
      />
    </>
  )
}
