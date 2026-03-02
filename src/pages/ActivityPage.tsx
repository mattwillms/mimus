import { useState } from 'react'
import { cn } from '@/lib/utils'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { AuditPage } from '@/pages/AuditPage'

const TABS = [
  { key: 'notifications', label: 'Notifications' },
  { key: 'audit', label: 'Audit' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function ActivityPage() {
  const [tab, setTab] = useState<TabKey>('notifications')

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

      {tab === 'notifications' && <NotificationsPage />}
      {tab === 'audit' && <AuditPage />}
    </div>
  )
}
