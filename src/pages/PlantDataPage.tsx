import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePlantCoverage } from '@/api/admin'

function coverageBarColor(pct: number): string {
  if (pct >= 75) return 'bg-primary'
  if (pct >= 50) return 'bg-amber-500'
  return 'bg-destructive'
}

export function PlantDataPage() {
  const { data: coverage, isLoading: coverageLoading } = usePlantCoverage()

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Plant Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {coverage
            ? `${coverage.total_plants.toLocaleString()} canonical plants`
            : 'Loading...'}
        </p>
      </div>

      {/* Section 1: Field Coverage */}
      {coverageLoading && <p className="text-sm text-muted-foreground">Loading coverage...</p>}

      {coverage && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Field Coverage</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Field</TableHead>
                  <TableHead className="w-[100px] text-right">Populated</TableHead>
                  <TableHead className="w-[100px] text-right">Total</TableHead>
                  <TableHead className="w-[180px]">Coverage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverage.fields.map((f) => (
                  <TableRow key={f.field_name}>
                    <TableCell className="font-mono text-xs">{f.field_name}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {f.populated.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {f.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${coverageBarColor(f.pct)}`}
                            style={{ width: `${Math.min(f.pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {f.pct}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

    </div>
  )
}
