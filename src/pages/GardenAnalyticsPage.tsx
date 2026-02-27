import { useGardenAnalytics } from '@/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

export function GardenAnalyticsPage() {
  const { data, isLoading, isError } = useGardenAnalytics()

  const maxCount =
    data && data.plantings_by_status.length > 0
      ? Math.max(...data.plantings_by_status.map((s) => s.count))
      : 1

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Garden Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Aggregate stats across all users</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load garden analytics.</p>}

      {data && (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard title="Total Users" value={String(data.totals.users)} />
            <StatCard title="Total Gardens" value={String(data.totals.gardens)} />
            <StatCard title="Total Beds" value={String(data.totals.beds)} />
            <StatCard title="Active Plantings" value={String(data.totals.active_plantings)} />
          </div>

          {/* Plantings by status */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Plantings by Status
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {data.plantings_by_status.length === 0 ? (
                <p className="text-sm text-muted-foreground">No plantings yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.plantings_by_status.map(({ status, count }) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs capitalize text-muted-foreground">
                        {status}
                      </span>
                      <div className="flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${Math.max(2, (count / maxCount) * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-medium text-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 10 plants */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top 10 Most Planted Species
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {data.top_plants.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-muted-foreground">No plantings yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Plant</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.top_plants.map((plant, i) => (
                      <TableRow key={plant.plant_id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{plant.common_name}</TableCell>
                        <TableCell className="text-right">{plant.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
