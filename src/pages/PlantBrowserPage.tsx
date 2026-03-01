import { useEffect, useState } from 'react'
import { Search, X, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useAdminPlants, useAdminPlantSources } from '@/api/admin'
import type { AdminPlantBrowseParams, PermapeopleSourceData, PerenualSourceData } from '@/types/admin'

const PER_PAGE = 50
const FIELD_TOTAL = 14

function SourcePanel({
  plantId,
  onClose,
}: {
  plantId: number
  onClose: () => void
}) {
  const { data, isLoading } = useAdminPlantSources(plantId)

  return (
    <div
      className="fixed right-0 z-40 flex w-full max-w-2xl flex-col border-l border-border bg-card shadow-xl"
      style={{ top: '56px', height: 'calc(100vh - 56px)' }}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="min-w-0">
          {data && (
            <>
              <h2 className="truncate text-sm font-semibold text-foreground">{data.common_name}</h2>
              {data.scientific_name && (
                <p className="truncate text-xs italic text-muted-foreground">{data.scientific_name}</p>
              )}
            </>
          )}
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {isLoading && <p className="text-sm text-muted-foreground">Loading source data...</p>}
        {data && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SourceColumn title="Perenual" data={data.perenual} type="perenual" />
            <SourceColumn title="Permapeople" data={data.permapeople} type="permapeople" />
          </div>
        )}
      </div>
    </div>
  )
}

function SourceColumn({
  title,
  data,
  type,
}: {
  title: string
  data: PerenualSourceData | PermapeopleSourceData | null
  type: 'perenual' | 'permapeople'
}) {
  if (!data) {
    return (
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">No data from this source.</p>
      </div>
    )
  }

  const entries = Object.entries(data).filter(
    ([key, value]) =>
      value !== null &&
      value !== undefined &&
      value !== '' &&
      key !== `${type}_id` &&
      key !== 'fetched_at',
  )

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Fetched: {new Date(data.fetched_at).toLocaleDateString()}
      </p>
      <dl className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {key.replace(/_/g, ' ')}
            </dt>
            <dd className="mt-0.5 break-words text-xs text-foreground">
              {String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function PlantBrowserPage() {
  const [inputValue, setInputValue] = useState('')
  const [debouncedName, setDebouncedName] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name_asc')
  const [page, setPage] = useState(1)
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(inputValue)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [inputValue])

  const sourceMap: Record<string, { source?: string; both_sources?: boolean }> = {
    all: {},
    perenual: { source: 'perenual' },
    permapeople: { source: 'permapeople' },
    both: { both_sources: true },
    user: { source: 'user' },
  }

  const params: AdminPlantBrowseParams = {
    name: debouncedName || undefined,
    ...sourceMap[sourceFilter],
    sort_by: sortBy,
    page,
    per_page: PER_PAGE,
  }

  const { data, isLoading } = useAdminPlants(params)
  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 0

  return (
    <>
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Plant Browser</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `${data.total.toLocaleString()} plants` : 'Loading...'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            className="pl-9"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="perenual">Perenual only</SelectItem>
            <SelectItem value="permapeople">Permapeople only</SelectItem>
            <SelectItem value="both">Both sources</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name A→Z</SelectItem>
            <SelectItem value="name_desc">Name Z→A</SelectItem>
            <SelectItem value="coverage_asc">Coverage ↑</SelectItem>
            <SelectItem value="coverage_desc">Coverage ↓</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && data && data.items.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No plants match the current filters.</p>
      )}

      {!isLoading && data && data.items.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Name</TableHead>
                  <TableHead className="hidden md:table-cell">Scientific name</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead>Sources</TableHead>
                  <TableHead className="w-[100px]">Coverage</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((plant) => (
                  <TableRow key={plant.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{plant.common_name}</p>
                        {plant.cultivar_name && (
                          <p className="truncate text-xs text-muted-foreground">'{plant.cultivar_name}'</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="truncate text-sm italic text-muted-foreground">
                        {plant.scientific_name || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {plant.plant_type ? (
                        <Badge variant="secondary" className="text-xs">{plant.plant_type}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {plant.has_perenual && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">P</Badge>
                        )}
                        {plant.has_permapeople && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">PP</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(plant.field_count / FIELD_TOTAL) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {plant.field_count}/{FIELD_TOTAL}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPlantId(plant.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

    </div>

    {/* Source comparison panel */}
    {selectedPlantId !== null && (
      <>
        <div
          className="fixed inset-x-0 bottom-0 z-30 bg-foreground/20 backdrop-blur-sm"
          style={{ top: '56px' }}
          onClick={() => setSelectedPlantId(null)}
        />
        <SourcePanel
          plantId={selectedPlantId}
          onClose={() => setSelectedPlantId(null)}
        />
      </>
    )}
  </>
  )
}
