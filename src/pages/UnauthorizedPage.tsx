import { useAuth } from '@/store/authStore'
import { Button } from '@/components/ui/button'

export function UnauthorizedPage() {
  const { logout } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-sm text-center">
        <h1 className="font-serif text-xl font-semibold text-foreground">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">Admin accounts only.</p>
        <Button className="mt-6" variant="outline" onClick={logout}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
