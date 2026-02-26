import { useState } from 'react'
import { useWeatherAnalytics } from '@/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

const DAY_OPTIONS = [7, 30, 90, 365] as const

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

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

export function WeatherPage() {
  const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>(30)
  const { data, isLoading, isError, error } = useWeatherAnalytics(days)

  const noLocation =
    isError &&
    (error as { response?: { status?: number } })?.response?.status === 422

  const chartData = data?.records.map((r) => ({
    date: formatDate(r.date),
    high: r.high_temp_f,
    low: r.low_temp_f,
    precip: r.precip_inches,
  }))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Weather Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historical weather cache for your location
        </p>
      </div>

      {/* Days selector */}
      <div className="flex gap-2">
        {DAY_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              days === d
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
          >
            {d} days
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading weather data…</p>}

      {noLocation && (
        <p className="text-sm text-muted-foreground">
          No location set for admin account. Update your profile to enable weather analytics.
        </p>
      )}

      {isError && !noLocation && (
        <p className="text-sm text-destructive">Failed to load weather data.</p>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              title="Avg High"
              value={data.summary.avg_high_f !== null ? `${data.summary.avg_high_f}°F` : '—'}
            />
            <StatCard
              title="Avg Low"
              value={data.summary.avg_low_f !== null ? `${data.summary.avg_low_f}°F` : '—'}
            />
            <StatCard
              title="Total Precip"
              value={
                data.summary.total_precip_inches !== null
                  ? `${data.summary.total_precip_inches}"`
                  : '—'
              }
            />
            <StatCard title="Frost Days" value={String(data.summary.frost_days)} />
          </div>

          {data.records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weather data cached yet.</p>
          ) : (
            <>
              {/* Temperature chart */}
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Temperature (°F)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 11 }} width={36} />
                      <Tooltip
                        formatter={(value, name) => [
                          value != null ? `${value}°F` : '—',
                          name === 'high' ? 'High' : 'Low',
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend
                        formatter={(value) => (value === 'high' ? 'High' : 'Low')}
                      />
                      <Line
                        type="monotone"
                        dataKey="high"
                        stroke="#ef4444"
                        dot={false}
                        strokeWidth={2}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="low"
                        stroke="#3b82f6"
                        dot={false}
                        strokeWidth={2}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Precipitation chart */}
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Precipitation (inches)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 11 }} width={36} />
                      <Tooltip
                        formatter={(value) => [
                          value != null ? `${value}"` : '—',
                          'Precip',
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Bar dataKey="precip" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
