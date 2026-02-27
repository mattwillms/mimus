import { useState } from 'react'
import { useAdminUsers, useCreateAdminUser, useDeleteAdminUser, useUpdateAdminUser } from '@/api/admin'
import { useAuth } from '@/store/authStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus } from 'lucide-react'
import type { AdminUser } from '@/types/admin'

// ── Create dialog form state ──────────────────────────────────────────────────

interface CreateForm {
  first_name: string
  last_name: string
  email: string
  password: string
  role: string
  is_active: boolean
}

function emptyCreate(): CreateForm {
  return { first_name: '', last_name: '', email: '', password: '', role: 'user', is_active: true }
}

// ── Edit dialog form state ────────────────────────────────────────────────────

interface EditForm {
  first_name: string
  last_name: string
  email: string
  password: string
  role: string
  is_active: boolean
  timezone: string
  zip_code: string
  hardiness_zone: string
  latitude: string
  longitude: string
}

function userToEditForm(u: AdminUser): EditForm {
  return {
    first_name: u.first_name,
    last_name: u.last_name ?? '',
    email: u.email,
    password: '',
    role: u.role,
    is_active: u.is_active,
    timezone: u.timezone ?? '',
    zip_code: u.zip_code ?? '',
    hardiness_zone: u.hardiness_zone ?? '',
    latitude: u.latitude !== null ? String(u.latitude) : '',
    longitude: u.longitude !== null ? String(u.longitude) : '',
  }
}

function displayName(u: AdminUser): string {
  return u.last_name ? `${u.first_name} ${u.last_name}` : u.first_name
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)
  const perPage = 20
  const { data, isLoading, isError } = useAdminUsers(page, perPage)
  const totalPages = data ? Math.ceil(data.total / perPage) : 1

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate)
  const createUser = useCreateAdminUser()

  // Edit dialog
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const updateUser = useUpdateAdminUser(editUser?.id ?? 0)
  const deleteUser = useDeleteAdminUser()

  function openEdit(user: AdminUser) {
    setEditUser(user)
    setEditForm(userToEditForm(user))
    setDeleteConfirm(false)
  }

  function closeEdit() {
    setEditUser(null)
    setEditForm(null)
    setDeleteConfirm(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createUser.mutateAsync({
      first_name: createForm.first_name.trim(),
      last_name: createForm.last_name.trim() || undefined,
      email: createForm.email.trim(),
      password: createForm.password,
      role: createForm.role,
      is_active: createForm.is_active,
    })
    setCreateForm(emptyCreate())
    setCreateOpen(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser || !editForm) return
    const payload: Record<string, unknown> = {
      first_name: editForm.first_name.trim() || undefined,
      last_name: editForm.last_name.trim() || undefined,
      email: editForm.email.trim() || undefined,
      role: editForm.role,
      is_active: editForm.is_active,
      timezone: editForm.timezone.trim() || undefined,
      zip_code: editForm.zip_code.trim() || undefined,
      hardiness_zone: editForm.hardiness_zone.trim() || undefined,
      latitude: editForm.latitude !== '' ? parseFloat(editForm.latitude) : undefined,
      longitude: editForm.longitude !== '' ? parseFloat(editForm.longitude) : undefined,
    }
    if (editForm.password) payload.password = editForm.password
    await updateUser.mutateAsync(payload)
    closeEdit()
  }

  async function handleDelete() {
    if (!editUser) return
    await deleteUser.mutateAsync(editUser.id)
    closeEdit()
  }

  const isSelf = editUser?.email === currentUser?.email
  const editDisplayName = editUser
    ? `${editUser.first_name ?? ''} ${editUser.last_name ?? ''}`.trim()
    : ''

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} total users` : 'User management'}
          </p>
        </div>
        <Button onClick={() => { setCreateForm(emptyCreate()); setCreateOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          New user
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading users…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load users.</p>}

      {data && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Lat</TableHead>
                  <TableHead>Lon</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openEdit(user)}
                    >
                      <TableCell className="font-medium">{displayName(user)}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                          }
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.hardiness_zone ?? '—'}</TableCell>
                      <TableCell>{user.latitude !== null ? user.latitude : '—'}</TableCell>
                      <TableCell>{user.longitude !== null ? user.longitude : '—'}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-first-name">First name</Label>
                <Input
                  id="c-first-name"
                  value={createForm.first_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, first_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-last-name">Last name</Label>
                <Input
                  id="c-last-name"
                  value={createForm.last_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-password">Password</Label>
              <Input
                id="c-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-role">Role</Label>
                <select
                  id="c-role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="c-active"
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="c-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating…' : 'Create user'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) closeEdit() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="e-first-name">First name</Label>
                  <Input
                    id="e-first-name"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-last-name">Last name</Label>
                  <Input
                    id="e-last-name"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-email">Email</Label>
                <Input
                  id="e-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => f && ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-password">New password (leave blank to keep)</Label>
                <Input
                  id="e-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((f) => f && ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="e-role">Role</Label>
                  <select
                    id="e-role"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, role: e.target.value }))}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="e-active"
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, is_active: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="e-active">Active</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="e-timezone">Timezone</Label>
                  <Input
                    id="e-timezone"
                    value={editForm.timezone}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, timezone: e.target.value }))}
                    placeholder="e.g. America/Chicago"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-zip">ZIP code</Label>
                  <Input
                    id="e-zip"
                    value={editForm.zip_code}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, zip_code: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="e-zone">Hardiness zone</Label>
                  <Input
                    id="e-zone"
                    value={editForm.hardiness_zone}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, hardiness_zone: e.target.value }))}
                    placeholder="e.g. 8b"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-lat">Latitude</Label>
                  <Input
                    id="e-lat"
                    type="number"
                    step="any"
                    value={editForm.latitude}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, latitude: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e-lon">Longitude</Label>
                  <Input
                    id="e-lon"
                    type="number"
                    step="any"
                    value={editForm.longitude}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, longitude: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {!deleteConfirm ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:text-destructive mr-auto"
                      disabled={isSelf}
                      onClick={() => setDeleteConfirm(true)}
                      title={isSelf ? 'Cannot delete your own account' : undefined}
                    >
                      Delete user
                    </Button>
                    <Button type="button" variant="outline" onClick={closeEdit}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateUser.isPending}>
                      {updateUser.isPending ? 'Saving…' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="mr-auto text-sm text-destructive">
                      Delete <strong>{editDisplayName}</strong>? This cannot be undone.
                    </span>
                    <Button type="button" variant="outline" onClick={() => setDeleteConfirm(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleteUser.isPending}
                      onClick={handleDelete}
                    >
                      {deleteUser.isPending ? 'Deleting…' : 'Delete'}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
