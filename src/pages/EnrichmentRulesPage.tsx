import { Loader2 } from 'lucide-react'
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
import {
  useEnrichmentRules,
  useUpdateEnrichmentRule,
  useTriggerEnrichment,
  useFetchStatus,
} from '@/api/admin'

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

export function EnrichmentRulesPage() {
  const { data: rulesData, isLoading: rulesLoading } = useEnrichmentRules()
  const updateRule = useUpdateEnrichmentRule()
  const enrichTrigger = useTriggerEnrichment()
  const { data: fetchStatus } = useFetchStatus()

  const anyRunning =
    fetchStatus?.permapeople.is_running ||
    fetchStatus?.perenual.is_running ||
    fetchStatus?.enrichment.is_running

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Enrichment Rules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rulesData ? `${rulesData.items.length} rules configured` : 'Loading...'}
          </p>
        </div>
        <Button
          size="sm"
          disabled={!!anyRunning || enrichTrigger.isPending}
          onClick={() => enrichTrigger.mutate()}
        >
          {enrichTrigger.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Queued...
            </>
          ) : anyRunning ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Running...
            </>
          ) : (
            'Run Enrichment'
          )}
        </Button>
      </div>

      {rulesLoading && <p className="text-sm text-muted-foreground">Loading rules...</p>}

      {rulesData && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Field</TableHead>
                <TableHead className="w-[160px]">Strategy</TableHead>
                <TableHead>Source Priority</TableHead>
                <TableHead className="w-[120px]">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rulesData.items.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono text-xs">{rule.field_name}</TableCell>
                  <TableCell>
                    <Select
                      value={rule.strategy}
                      onValueChange={(v) =>
                        updateRule.mutate({ field_name: rule.field_name, data: { strategy: v } })
                      }
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priority">priority</SelectItem>
                        <SelectItem value="union">union</SelectItem>
                        <SelectItem value="longest">longest</SelectItem>
                        <SelectItem value="average">average</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {rule.source_priority ? (
                      <div className="flex flex-wrap gap-1">
                        {rule.source_priority.map((src) => (
                          <Badge key={src} variant="outline" className="px-1.5 py-0 text-[10px]">
                            {src}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {timeAgo(rule.updated_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
