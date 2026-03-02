import { createBrowserRouter } from 'react-router'
import { LoginPage } from '@/pages/LoginPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { AppLayout } from '@/layouts/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { PlantsPage } from '@/pages/PlantsPage'
import { WeatherPage } from '@/pages/WeatherPage'
import { DataSourcesPage } from '@/pages/DataSourcesPage'
import { ActivityPage } from '@/pages/ActivityPage'
import { SystemLogsPage } from '@/pages/SystemLogsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ErrorPage } from '@/pages/ErrorPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'plants',
        element: <PlantsPage />,
      },
      {
        path: 'weather',
        element: <WeatherPage />,
      },
      {
        path: 'data-sources',
        element: <DataSourcesPage />,
      },
      {
        path: 'activity',
        element: <ActivityPage />,
      },
      {
        path: 'system-logs',
        element: <SystemLogsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
