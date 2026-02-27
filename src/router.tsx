import { createBrowserRouter } from 'react-router'
import { LoginPage } from '@/pages/LoginPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { AppLayout } from '@/layouts/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { PipelinesPage } from '@/pages/PipelinesPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { WeatherPage } from '@/pages/WeatherPage'
import { GardenAnalyticsPage } from '@/pages/GardenAnalyticsPage'
import { ApiLogsPage } from '@/pages/ApiLogsPage'
import { AuditPage } from '@/pages/AuditPage'
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
        path: 'pipelines',
        element: <PipelinesPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'weather',
        element: <WeatherPage />,
      },
      {
        path: 'analytics',
        element: <GardenAnalyticsPage />,
      },
      {
        path: 'logs',
        element: <ApiLogsPage />,
      },
      {
        path: 'audit',
        element: <AuditPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
