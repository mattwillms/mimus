import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import {
  LayoutDashboard,
  Users,
  Database,
  Leaf,
  ChartBar,
  Activity,
  Bell,
  Cloud,
  BarChart2,
  FileText,
  ClipboardList,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/store/authStore'
import { useTheme, type Theme } from '@/store/themeStore'
import { cn } from '@/lib/utils'

interface ThemeCircleProps {
  label: string
  active: boolean
  onClick: () => void
  className: string
}

function ThemeCircle({ label, active, onClick, className }: ThemeCircleProps) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'h-[22px] w-[22px] rounded-full transition-all duration-200',
        className,
        active && 'ring-2 ring-primary ring-offset-2',
      )}
    />
  )
}

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/data-sources', icon: Database, label: 'Data Sources' },
  { to: '/plants', icon: Leaf, label: 'Plant Browser' },
  { to: '/plant-data', icon: ChartBar, label: 'Plant Data' },
  { to: '/pipelines', icon: Activity, label: 'Jobs' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/weather', icon: Cloud, label: 'Weather' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/logs', icon: FileText, label: 'API Logs' },
  { to: '/audit', icon: ClipboardList, label: 'Audit' },
]

function getInitials(first_name: string, last_name: string | null): string {
  const first = first_name[0] ?? ''
  const last = last_name ? last_name[0] : ''
  return (first + last).toUpperCase()
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const initials = user ? getInitials(user.first_name, user.last_name) : '?'

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Wordmark */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-5">
          <img src="/icon.svg" alt="Mimus" className="h-6 w-6 rounded-sm" />
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Mimus
          </span>
          <button
            className="ml-auto rounded p-0.5 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 pt-4">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 p-3 pt-0">
          <Separator className="mb-3" />
          <p className="px-3 text-[11px] tracking-wide text-muted-foreground/50">
            control.willms.co
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
          {/* Mobile hamburger */}
          <button
            className="rounded p-1 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile wordmark */}
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground lg:hidden">
            Mimus
          </span>

          <div className="flex-1" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[140px] truncate sm:block">
                  {user?.first_name} {user?.last_name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{user?.first_name} {user?.last_name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-2">
                <p className="mb-2 text-xs text-muted-foreground">Theme</p>
                <div className="flex gap-2">
                  <ThemeCircle
                    label="Light"
                    active={theme === 'light'}
                    onClick={() => setTheme('light' as Theme)}
                    className="bg-[hsl(210,20%,96%)] border border-border"
                  />
                  <ThemeCircle
                    label="Dark"
                    active={theme === 'dark'}
                    onClick={() => setTheme('dark' as Theme)}
                    className="bg-[hsl(207,25%,12%)]"
                  />
                  <ThemeCircle
                    label="OLED"
                    active={theme === 'oled'}
                    onClick={() => setTheme('oled' as Theme)}
                    className="bg-black"
                  />
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
