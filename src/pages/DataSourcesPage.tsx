import { useSearchParams } from 'react-router'
import { cn } from '@/lib/utils'
import { DataSourcesTab } from '@/pages/DataSourcesTab'
import { ImageCachingTab } from '@/pages/ImageCachingTab'
import { EnrichmentEngineTab } from '@/pages/EnrichmentEngineTab'

const TABS = [
  { key: 'data-sources', label: 'Data Sources' },
  { key: 'image-caching', label: 'Image Caching' },
  { key: 'enrichment-engine', label: 'Enrichment Engine' },
] as const

type TabKey = (typeof TABS)[number]['key']

const TAB_KEYS = new Set<string>(TABS.map((t) => t.key))

export function DataSourcesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const tab: TabKey = rawTab && TAB_KEYS.has(rawTab) ? (rawTab as TabKey) : 'data-sources'

  function setTab(key: TabKey) {
    if (key === 'data-sources') {
      setSearchParams({})
    } else {
      setSearchParams({ tab: key })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Data Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">Plant data pipeline status</p>
      </div>

      <div className="flex gap-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'pb-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'data-sources' && <DataSourcesTab />}
      {tab === 'image-caching' && <ImageCachingTab />}
      {tab === 'enrichment-engine' && <EnrichmentEngineTab />}
    </div>
  )
}
