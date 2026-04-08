import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getRouteApi } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { TagFormDialog } from '@/components/core/tags/tag-form-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { deleteTag, listTags } from '@/sfn/tags'

export const Route = createFileRoute('/_authenticated/u/$uId/tags/')({
  component: RouteComponent,
})

const authenticatedRouteApi = getRouteApi('/_authenticated')

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { uId } = Route.useParams()
  const { currentUser: authBundle } = authenticatedRouteApi.useLoaderData()
  const sessionUserId = authBundle?.currentUser?.id

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingTag, setEditingTag] = useState<{
    id: string
    name: string
    isPublic: boolean
  } | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    if (sessionUserId && uId !== sessionUserId) {
      navigate({
        to: '/u/$uId/tags',
        params: { uId: sessionUserId },
        replace: true,
      })
    }
  }, [uId, sessionUserId, navigate])

  const listTagsSfn = useServerFn(listTags)
  const { data: tagRows = [], isPending } = useQuery({
    queryKey: ['tags', 'manage', { search: deferredSearch, limit: 100 }],
    queryFn: () =>
      listTagsSfn({
        data: {
          search: deferredSearch.trim() || undefined,
          limit: 100,
        },
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTag({ data: { id } }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['tags'] })
      setDeleteTarget(null)
      if (result.deleted) {
        toast.success('Tag deleted')
      } else {
        toast.error('Could not delete tag')
      }
    },
    onError: (error) => {
      toast.error('Delete failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const openCreate = () => {
    setFormMode('create')
    setEditingTag(null)
    setFormOpen(true)
  }

  const openEdit = (row: {
    id: string
    name: string
    isPublic: boolean
  }) => {
    setFormMode('edit')
    setEditingTag(row)
    setFormOpen(true)
  }

  return (
    <article className="border-border border-b">
      <header className="flex flex-col gap-4 border-border border-b px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-tight">Tags</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-xs">
            Tags you create can be used on requests. Public tags are shared with
            everyone.
          </p>
        </div>
        <Button
          type="button"
          className="cursor-pointer uppercase"
          onClick={openCreate}
        >
          New tag
        </Button>
      </header>

      <div className="space-y-4 p-6">
        <div className="flex max-w-md flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags…"
            className="font-mono text-xs"
            aria-label="Search tags"
          />
        </div>

        {isPending ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner />
            Loading tags…
          </div>
        ) : tagRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tags match your search. Create one to get started.
          </p>
        ) : (
          <div className="border-border overflow-x-auto border-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-border bg-muted/40 border-b">
                  <th className="px-3 py-2 font-bold uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wide">
                    Visibility
                  </th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wide">
                    Access
                  </th>
                  <th className="px-3 py-2 text-right font-bold uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tagRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-border hover:bg-muted/20 border-b last:border-b-0"
                  >
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2">
                      {row.isPublic ? (
                        <Badge variant="secondary" className="rounded-none text-[10px] uppercase">
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-none text-[10px] uppercase">
                          Private
                        </Badge>
                      )}
                    </td>
                    <td className="text-muted-foreground px-3 py-2">
                      {row.canEdit ? (
                        <span>Yours</span>
                      ) : (
                        <span>Community</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.canEdit ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer uppercase"
                            onClick={() =>
                              openEdit({
                                id: row.id,
                                name: row.name,
                                isPublic: row.isPublic,
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="cursor-pointer uppercase"
                            onClick={() =>
                              setDeleteTarget({ id: row.id, name: row.name })
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TagFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        tag={editingTag ?? undefined}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.name}” will be removed from the library. Links on
              existing requests will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  void deleteMutation.mutateAsync(deleteTarget.id)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}
