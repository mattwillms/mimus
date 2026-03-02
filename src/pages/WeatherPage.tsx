import { useMemo, useState } from 'react'
import { useWeatherAnalytics } from '@/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'
import { Snowflake, Thermometer } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WeatherRecord } from '@/types/admin'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'

const DAY_OPTIONS = [7, 30, 90] as const

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

interface ChartDatum {
  date: string
  rawDate: string
  high: number | null
  low: number | null
  precip: number | null
  humidity: number | null
  frost: boolean
  heat: boolean
}

interface CompareDatum {
  day: number
  highA: number | null
  lowA: number | null
  highB: number | null
  lowB: number | null
  dateA: string | null
  dateB: string | null
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: ValueType; payload: ChartDatum }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-foreground">Date: {label}</p>
      <p style={{ color: '#ef4444' }}>
        High: {row.high != null ? `${row.high}°F` : '—'}
      </p>
      <p style={{ color: '#3b82f6' }}>
        Low: {row.low != null ? `${row.low}°F` : '—'}
      </p>
      <p style={{ color: '#8b5cf6' }}>
        Humidity: {row.humidity != null ? `${row.humidity}%` : '—'}
      </p>
      <p style={{ color: '#60a5fa' }}>
        Precip: {row.precip != null ? `${row.precip}"` : '—'}
      </p>
      {row.frost && <p className="mt-1 text-blue-300 font-medium">&#10052; Frost warning</p>}
      {row.heat && <p className="mt-1 font-medium" style={{ color: '#f97316' }}>&#127777; Heat warning</p>}
    </div>
  )
}

function CompareTooltip({
  active,
  payload,
  label,
  labelA,
  labelB,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: ValueType; payload: CompareDatum }>
  label?: number
  labelA: string
  labelB: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1.5 font-medium text-foreground">Day {label}</p>
      <p className="text-xs font-medium text-muted-foreground">{labelA} (solid)</p>
      <p style={{ color: '#ef4444' }}>
        High: {row.highA != null ? `${row.highA}°F` : '—'}
        {row.dateA && <span className="text-muted-foreground text-xs ml-1">({formatDate(row.dateA)})</span>}
      </p>
      <p style={{ color: '#3b82f6' }}>
        Low: {row.lowA != null ? `${row.lowA}°F` : '—'}
        {row.dateA && <span className="text-muted-foreground text-xs ml-1">({formatDate(row.dateA)})</span>}
      </p>
      <p className="text-xs font-medium text-muted-foreground mt-1.5">{labelB} (dashed)</p>
      <p style={{ color: '#ef4444' }}>
        High: {row.highB != null ? `${row.highB}°F` : '—'}
        {row.dateB && <span className="text-muted-foreground text-xs ml-1">({formatDate(row.dateB)})</span>}
      </p>
      <p style={{ color: '#3b82f6' }}>
        Low: {row.lowB != null ? `${row.lowB}°F` : '—'}
        {row.dateB && <span className="text-muted-foreground text-xs ml-1">({formatDate(row.dateB)})</span>}
      </p>
    </div>
  )
}

function FrostLabel({ viewBox }: { viewBox?: { x?: number; y?: number } }) {
  const x = (viewBox?.x ?? 0) - 6
  const y = (viewBox?.y ?? 0) - 18
  return (
    <foreignObject x={x} y={y} width={12} height={12}>
      <Snowflake size={12} color="#93c5fd" strokeWidth={2} />
    </foreignObject>
  )
}

function HeatLabel({ viewBox }: { viewBox?: { x?: number; y?: number } }) {
  const x = (viewBox?.x ?? 0) - 6
  const y = (viewBox?.y ?? 0) - 18
  return (
    <foreignObject x={x} y={y} width={12} height={12}>
      <Thermometer size={12} color="#f97316" strokeWidth={2} />
    </foreignObject>
  )
}

/** Group consecutive true-flagged days into bands of [startDate, endDate]. */
function groupConsecutive(data: ChartDatum[], flag: 'frost' | 'heat'): { x1: string; x2: string }[] {
  const bands: { x1: string; x2: string }[] = []
  let startLabel: string | null = null
  let prevLabel: string | null = null
  let prevRaw: string | null = null
  for (const d of data) {
    if (d[flag]) {
      const isConsecutive =
        prevRaw !== null &&
        new Date(d.rawDate).getTime() - new Date(prevRaw).getTime() <= 86_400_000
      if (startLabel === null) {
        startLabel = d.date
      } else if (!isConsecutive) {
        bands.push({ x1: startLabel, x2: prevLabel! })
        startLabel = d.date
      }
      prevLabel = d.date
      prevRaw = d.rawDate
    } else {
      if (startLabel !== null && prevLabel !== null) {
        bands.push({ x1: startLabel, x2: prevLabel })
        startLabel = null
        prevLabel = null
        prevRaw = null
      }
    }
  }
  if (startLabel !== null && prevLabel !== null) bands.push({ x1: startLabel, x2: prevLabel })
  return bands
}

function quarterLabel(q: number, y: number): string {
  return `Q${q} ${y}`
}

type TimeMode =
  | { kind: 'days'; days: (typeof DAY_OPTIONS)[number] }
  | { kind: 'year'; year: number }
  | { kind: 'quarter'; quarter: number; quarter_year: number }
  | { kind: 'compare'; quarterA: { quarter: number; quarter_year: number }; quarterB: { quarter: number; quarter_year: number } }

export function WeatherPage() {
  const [mode, setMode] = useState<TimeMode>({ kind: 'days', days: 30 })

  // Primary query for non-compare modes
  const primaryParams =
    mode.kind === 'days'
      ? { days: mode.days }
      : mode.kind === 'year'
        ? { year: mode.year }
        : mode.kind === 'quarter'
          ? { quarter: mode.quarter, quarter_year: mode.quarter_year }
          : { days: 30 }
  const primary = useWeatherAnalytics(primaryParams, { enabled: mode.kind !== 'compare' })

  // Compare queries — only active in compare mode
  const compareAParams = mode.kind === 'compare'
    ? { quarter: mode.quarterA.quarter, quarter_year: mode.quarterA.quarter_year }
    : { days: 30 }
  const compareA = useWeatherAnalytics(compareAParams, { enabled: mode.kind === 'compare' })

  const compareBParams = mode.kind === 'compare'
    ? { quarter: mode.quarterB.quarter, quarter_year: mode.quarterB.quarter_year }
    : { days: 30 }
  const compareB = useWeatherAnalytics(compareBParams, { enabled: mode.kind === 'compare' })

  // Unified loading/error state
  const data = mode.kind !== 'compare' ? primary.data : undefined
  const isLoading = mode.kind === 'compare'
    ? compareA.isLoading || compareB.isLoading
    : primary.isLoading
  const isError = mode.kind === 'compare'
    ? compareA.isError || compareB.isError
    : primary.isError
  const error = mode.kind === 'compare'
    ? compareA.error || compareB.error
    : primary.error

  // available_quarters — primary cache persists when query is disabled
  const availableQuarters = primary.data?.available_quarters
    ?? compareA.data?.available_quarters
    ?? []

  const noLocation =
    isError &&
    (error as { response?: { status?: number } })?.response?.status === 422

  // Normal chart data
  const chartData: ChartDatum[] | undefined = data?.records.map((r: WeatherRecord) => ({
    date: formatDate(r.date),
    rawDate: r.date,
    high: r.high_temp_f,
    low: r.low_temp_f,
    precip: r.precip_inches,
    humidity: r.humidity_pct,
    frost: r.frost_warning,
    heat: r.heat_warning,
  }))

  // Compare chart data — zip two quarter datasets by index
  const compareData: CompareDatum[] | undefined = useMemo(() => {
    if (mode.kind !== 'compare') return undefined
    const recordsA = compareA.data?.records ?? []
    const recordsB = compareB.data?.records ?? []
    if (!recordsA.length && !recordsB.length) return undefined
    return Array.from(
      { length: Math.max(recordsA.length, recordsB.length) },
      (_, i) => ({
        day: i + 1,
        highA: recordsA[i]?.high_temp_f ?? null,
        lowA: recordsA[i]?.low_temp_f ?? null,
        highB: recordsB[i]?.high_temp_f ?? null,
        lowB: recordsB[i]?.low_temp_f ?? null,
        dateA: recordsA[i]?.date ?? null,
        dateB: recordsB[i]?.date ?? null,
      })
    )
  }, [mode.kind, compareA.data, compareB.data])

  // Always compute both reference lines (icons) and area bands (shading) for all modes
  const frostDates = chartData?.filter((d) => d.frost) ?? []
  const heatDates = chartData?.filter((d) => d.heat) ?? []
  const frostBands = useMemo(() => (chartData ? groupConsecutive(chartData, 'frost') : []), [chartData])
  const heatBands = useMemo(() => (chartData ? groupConsecutive(chartData, 'heat') : []), [chartData])

  // Debug: verify ReferenceArea x1/x2 matches XAxis dataKey values
  if (chartData && (frostBands.length > 0 || heatBands.length > 0)) {
    console.log('[WeatherPage] chartData dates (first 5):', chartData.slice(0, 5).map(d => d.date))
    if (frostBands.length > 0) console.log('[WeatherPage] frostBands (first 3):', frostBands.slice(0, 3))
    if (heatBands.length > 0) console.log('[WeatherPage] heatBands (first 3):', heatBands.slice(0, 3))
  }

  const allValuesEmpty =
    data &&
    data.records.length > 0 &&
    data.records.every(
      (r: WeatherRecord) =>
        r.high_temp_f == null &&
        r.low_temp_f == null &&
        r.precip_inches == null &&
        r.humidity_pct == null,
    )

  const avgHumidity =
    data?.records && data.records.length > 0
      ? (() => {
          const vals = data.records
            .map((r: WeatherRecord) => r.humidity_pct)
            .filter((v): v is number => v != null)
          return vals.length > 0
            ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
            : null
        })()
      : null

  // Quarter dropdown value encoding
  const quarterValue =
    mode.kind === 'quarter' ? `${mode.quarter}:${mode.quarter_year}` : ''

  // Compare mode values
  const compareAValue = mode.kind === 'compare'
    ? `${mode.quarterA.quarter}:${mode.quarterA.quarter_year}`
    : ''
  const compareBValue = mode.kind === 'compare'
    ? `${mode.quarterB.quarter}:${mode.quarterB.quarter_year}`
    : ''
  const compareLabelA = mode.kind === 'compare'
    ? quarterLabel(mode.quarterA.quarter, mode.quarterA.quarter_year)
    : ''
  const compareLabelB = mode.kind === 'compare'
    ? quarterLabel(mode.quarterB.quarter, mode.quarterB.quarter_year)
    : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Weather Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
          Historical weather data cached from Open-Meteo for your account location. Data is polled
          every 3 hours by the background worker and stored daily. If no data appears, verify the
          worker is running and your account has lat/lon set in your profile.
        </p>
      </div>

      {/* Time range controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {mode.kind !== 'compare' && (
          <>
            <div className="flex gap-2">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setMode({ kind: 'days', days: d })}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    mode.kind === 'days' && mode.days === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
            {data && (
              <>
                <span className="text-xs text-muted-foreground">|</span>
                {data.available_years.length > 0 && (
                  <select
                    value={mode.kind === 'year' ? mode.year : ''}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v) setMode({ kind: 'year', year: Number(v) })
                    }}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-0 cursor-pointer',
                      mode.kind === 'year'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70',
                    )}
                  >
                    <option value="" disabled>
                      Year...
                    </option>
                    {data.available_years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                )}
                {data.available_quarters.length > 0 && (
                  <select
                    value={quarterValue}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v) {
                        const [q, qy] = v.split(':')
                        setMode({ kind: 'quarter', quarter: Number(q), quarter_year: Number(qy) })
                      }
                    }}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-0 cursor-pointer',
                      mode.kind === 'quarter'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70',
                    )}
                  >
                    <option value="" disabled>
                      Quarter...
                    </option>
                    {data.available_quarters.map((q) => (
                      <option key={`${q.quarter}:${q.quarter_year}`} value={`${q.quarter}:${q.quarter_year}`}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </>
        )}

        {/* Compare toggle */}
        {(availableQuarters.length >= 2 || mode.kind === 'compare') && (
          <>
            {mode.kind !== 'compare' && <span className="text-xs text-muted-foreground">|</span>}
            <button
              onClick={() => {
                if (mode.kind === 'compare') {
                  setMode({ kind: 'days', days: 30 })
                } else {
                  const qs = availableQuarters
                  const a = qs[0]
                  const b = qs.find(
                    (q) => q.quarter === a.quarter && q.quarter_year === a.quarter_year - 1
                  ) ?? qs[1]
                  setMode({
                    kind: 'compare',
                    quarterA: { quarter: a.quarter, quarter_year: a.quarter_year },
                    quarterB: { quarter: b.quarter, quarter_year: b.quarter_year },
                  })
                }
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                mode.kind === 'compare'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              Compare
            </button>
          </>
        )}

        {/* Compare period selectors */}
        {mode.kind === 'compare' && availableQuarters.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground">|</span>
            <label className="text-xs text-muted-foreground">Period A</label>
            <select
              value={compareAValue}
              onChange={(e) => {
                const [q, qy] = e.target.value.split(':')
                setMode({
                  ...mode,
                  quarterA: { quarter: Number(q), quarter_year: Number(qy) },
                })
              }}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-0 cursor-pointer bg-muted text-muted-foreground hover:bg-muted/70"
            >
              {availableQuarters.map((q) => (
                <option key={`a-${q.quarter}:${q.quarter_year}`} value={`${q.quarter}:${q.quarter_year}`}>
                  {q.label}
                </option>
              ))}
            </select>
            <span className="text-xs font-medium text-muted-foreground">vs</span>
            <label className="text-xs text-muted-foreground">Period B</label>
            <select
              value={compareBValue}
              onChange={(e) => {
                const [q, qy] = e.target.value.split(':')
                setMode({
                  ...mode,
                  quarterB: { quarter: Number(q), quarter_year: Number(qy) },
                })
              }}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-0 cursor-pointer bg-muted text-muted-foreground hover:bg-muted/70"
            >
              {availableQuarters.map((q) => (
                <option key={`b-${q.quarter}:${q.quarter_year}`} value={`${q.quarter}:${q.quarter_year}`}>
                  {q.label}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading weather data...</p>}

      {noLocation && (
        <p className="text-sm text-muted-foreground">
          No location set on admin account. Add your ZIP code in your Mimus profile to enable
          weather analytics.
        </p>
      )}

      {isError && !noLocation && (
        <p className="text-sm text-destructive">Failed to load weather data.</p>
      )}

      {/* Compare mode chart */}
      {mode.kind === 'compare' && !isLoading && !isError && compareData && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {compareLabelA} vs {compareLabelB}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart
                data={compareData}
                margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  label={{ value: 'Day of Quarter', position: 'insideBottom', offset: -2, style: { fontSize: 11, fill: '#a1a1aa' } }}
                />
                <YAxis
                  yAxisId="temp"
                  tick={{ fontSize: 11 }}
                  width={40}
                  label={{
                    value: '°F',
                    position: 'insideTopLeft',
                    offset: -4,
                    style: { fontSize: 11, fill: '#a1a1aa' },
                  }}
                />
                <Tooltip content={<CompareTooltip labelA={compareLabelA} labelB={compareLabelB} />} />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="highA"
                  stroke="#ef4444"
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                  name={`${compareLabelA} High`}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="lowA"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                  name={`${compareLabelA} Low`}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="highB"
                  stroke="#ef4444"
                  dot={false}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  connectNulls
                  name={`${compareLabelB} High`}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="lowB"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  connectNulls
                  name={`${compareLabelB} Low`}
                />
              </ComposedChart>
            </ResponsiveContainer>
            {/* Compare legend */}
            <div className="flex items-center justify-center gap-5 mt-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#ef4444" strokeWidth="2" /></svg>
                {compareLabelA} High
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#3b82f6" strokeWidth="2" /></svg>
                {compareLabelA} Low
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" /></svg>
                {compareLabelB} High
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 3" /></svg>
                {compareLabelB} Low
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {mode.kind === 'compare' && !isLoading && !isError && !compareData && (
        <p className="text-sm text-muted-foreground">No weather data for the selected quarters.</p>
      )}

      {/* Normal mode content */}
      {data && mode.kind !== 'compare' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
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
            <StatCard title="Heat Days" value={String(data.summary.heat_days)} />
            <StatCard
              title="Avg Humidity"
              value={avgHumidity !== null ? `${avgHumidity}%` : '—'}
            />
            <StatCard title="Data Points" value={String(data.records.length)} />
          </div>

          {allValuesEmpty ? (
            <p className="text-sm text-muted-foreground">
              Weather cache is empty for your location. The background worker polls Open-Meteo every
              3 hours — check the Jobs page to confirm sync_weather is running.
            </p>
          ) : data.records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weather data cached yet.</p>
          ) : (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Weather Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={360}>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                      padding={{ left: 0, right: 0 }}
                      {...(mode.kind !== 'days' && chartData && chartData.length > 0
                        ? { domain: [chartData[0].date, chartData[chartData.length - 1].date] }
                        : {})}
                    />
                    <YAxis
                      yAxisId="temp"
                      tick={{ fontSize: 11 }}
                      width={40}
                      label={{
                        value: '°F',
                        position: 'insideTopLeft',
                        offset: -4,
                        style: { fontSize: 11, fill: '#a1a1aa' },
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      width={44}
                      label={{
                        value: '%',
                        position: 'insideTopRight',
                        offset: -4,
                        style: { fontSize: 11, fill: '#a1a1aa' },
                      }}
                    />
                    <YAxis
                      yAxisId="precip"
                      orientation="right"
                      domain={[0, (dataMax: number) => Math.max(dataMax + 0.5, 1)]}
                      hide
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Frost/heat reference lines with icons */}
                    {frostDates.map((d) => (
                      <ReferenceLine
                        key={`frost-${d.rawDate}`}
                        x={d.date}
                        yAxisId="temp"
                        stroke="#93c5fd"
                        strokeDasharray="3 4"
                        strokeOpacity={0.7}
                        label={<FrostLabel />}
                      />
                    ))}
                    {heatDates.map((d) => (
                      <ReferenceLine
                        key={`heat-${d.rawDate}`}
                        x={d.date}
                        yAxisId="temp"
                        stroke="#f97316"
                        strokeDasharray="3 4"
                        strokeOpacity={0.8}
                        label={<HeatLabel />}
                      />
                    ))}
                    {/* Frost/heat shaded area bands */}
                    {frostBands.map((b, i) => (
                      <ReferenceArea
                        key={`frost-band-${i}`}
                        x1={b.x1}
                        x2={b.x2}
                        yAxisId="temp"
                        fill="#93c5fd"
                        fillOpacity={0.08}
                        stroke="none"
                      />
                    ))}
                    {heatBands.map((b, i) => (
                      <ReferenceArea
                        key={`heat-band-${i}`}
                        x1={b.x1}
                        x2={b.x2}
                        yAxisId="temp"
                        fill="#f97316"
                        fillOpacity={0.10}
                        stroke="none"
                      />
                    ))}
                    <Bar
                      yAxisId="precip"
                      dataKey="precip"
                      fill="#60a5fa"
                      opacity={0.4}
                      radius={[2, 2, 0, 0]}
                    />
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="high"
                      stroke="#ef4444"
                      dot={false}
                      strokeWidth={2}
                      connectNulls
                    />
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="low"
                      stroke="#3b82f6"
                      dot={false}
                      strokeWidth={2}
                      connectNulls
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="humidity"
                      stroke="#8b5cf6"
                      dot={false}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                {/* Unified custom legend */}
                <div className="flex items-center justify-center gap-5 mt-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#ef4444" strokeWidth="2" /></svg>
                    High Temp
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#3b82f6" strokeWidth="2" /></svg>
                    Low Temp
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 3" /></svg>
                    Humidity %
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="10" height="10"><rect width="10" height="10" rx="1" fill="#60a5fa" opacity="0.5" /></svg>
                    Precipitation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3 4" /></svg>
                    <Snowflake size={12} color="#93c5fd" /> Frost
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#f97316" strokeWidth="2" strokeDasharray="3 4" /></svg>
                    <Thermometer size={12} color="#f97316" /> Heat
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
