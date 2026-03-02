import { useSearchParams } from 'react-router'
import { cn } from '@/lib/utils'
import { PlantBrowserPage } from '@/pages/PlantBrowserPage'
import { PlantDataPage } from '@/pages/PlantDataPage'
import { GardenAnalyticsPage } from '@/pages/GardenAnalyticsPage'
import { EnrichmentRulesPage } from '@/pages/EnrichmentRulesPage'

const TABS = [
  { key: 'browser', label: 'Browser' },
  { key: 'plant-data', label: 'Plant Data' },
  { key: 'garden-analytics', label: 'Garden Analytics' },
  { key: 'enrichment-rules', label: 'Enrichment Rules' },
] as const

type TabKey = (typeof TABS)[number]['key']

const TAB_KEYS = new Set<string>(TABS.map((t) => t.key))

export function PlantsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const tab: TabKey = rawTab && TAB_KEYS.has(rawTab) ? (rawTab as TabKey) : 'browser'

  function setTab(key: TabKey) {
    if (key === 'browser') {
      setSearchParams({})
    } else {
      setSearchParams({ tab: key })
    }
  }

  return (
    <div className="space-y-6">
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

      {tab === 'browser' && <PlantBrowserPage />}
      {tab === 'plant-data' && <PlantDataPage />}
      {tab === 'garden-analytics' && <GardenAnalyticsPage />}
      {tab === 'enrichment-rules' && <EnrichmentRulesPage />}
    </div>
  )
}
