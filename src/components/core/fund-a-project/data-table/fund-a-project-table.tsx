import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { EllipsisIcon, EyeIcon, PencilIcon, ViewIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { UseTableStateReturn } from '@/components/core/server-table'
import type {
  FundAProjectOutput,
  FundAPublicListSearch,
  FundProjectLevelValue,
  GetFundAProjectsResult,
} from '@/types/fund-a-project'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableSimpleFilter } from '@/components/ui/data-table/data-table-simple-filter'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { FUND_PROJECT_LEVEL_LABEL } from '@/types/fund-a-project'
import { useDataTable } from '@/components/core/server-table'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FUND_PROJECT_LEVEL } from '@/constants/enums'
import { getOptionalCurrentUser } from '@/sfn/users'

const FUND_LIST_SORT_OPTIONS: Array<{
  value: FundAPublicListSearch['sort']
  label: string
}> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'urgent', label: 'Lowest funding first' },
]

const LEVEL_FILTER_OPTIONS = FUND_PROJECT_LEVEL.map((l) => ({
  label: l.label,
  value: l.value,
}))

export type FundAListUrlControls = {
  sort: FundAPublicListSearch['sort']
  onSortChange: (sort: FundAPublicListSearch['sort']) => void
  selectedLevels: Array<FundProjectLevelValue>
  onLevelsChange: (levels: Array<FundProjectLevelValue>) => void
  selectedTagIds: Array<string>
  onTagIdsChange: (tagIds: Array<string>) => void
  featuredOnly: boolean
  onFeaturedOnlyChange: (value: boolean) => void
  tagOptions: Array<{ label: string; value: string }>
  hasActiveFilters: boolean
  onResetList: () => void
}

type FundAProjectTableProps = {
  /** Pagination/sort state from `useTableState` (server-table), bridged via `useDataTable`. */
  serverTable: UseTableStateReturn
  data: GetFundAProjectsResult
  pageSizeOptions?: Array<number>
  filterOptions?: Array<{
    title: string
    column_name: string
    icon?: React.ComponentType<{ className?: string }>
    variant?: 'multiple' | 'single'
    data: Array<{ label: string; value: string }>
    useSimpleFilter?: boolean
  }>
  /** Draft query for toolbar; use with `onSearchSubmit` to commit URL `q` → server `ilike`. */
  searchQuery?: string
  onSearchQueryChange?: (value: string) => void
  /** Run when user clicks search or presses Enter in the toolbar input group. */
  onSearchSubmit?: () => void
  /** URL-backed sort, levels, tags, featured — drives `getFundAProjects` via parent navigate. */
  fundListUrl?: FundAListUrlControls
}

export const createFundAProjectTableColumns = (
  setPreviewData: (data: FundAProjectOutput) => void,
): Array<ColumnDef<FundAProjectOutput>> => [
  {
    accessorKey: 'title',
    enableSorting: false,
    header: 'Title',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('title')}</div>
    ),
  },
  {
    accessorKey: 'targetAmount',
    enableSorting: false,
    header: 'Target Amount',
    cell: ({ row }) => {
      const amount = row.original.targetAmount
      return <div className="font-mono">${amount.toLocaleString()}</div>
    },
  },
  {
    accessorKey: 'fundedAmount',
    enableSorting: false,
    header: 'Funded Amount',
    cell: ({ row }) => {
      const amount = row.original.fundedAmount
      return (
        <div className="font-mono text-green-600">
          ${amount.toLocaleString()}
        </div>
      )
    },
  },
  {
    accessorKey: 'projectLevel',
    enableSorting: false,
    header: 'Level',
    cell: ({ row }) => {
      const level = row.original.projectLevel
      return (
        <Badge variant="secondary">{FUND_PROJECT_LEVEL_LABEL[level]}</Badge>
      )
    },
  },
  {
    id: 'actions',
    enableSorting: false,
    cell: ({ row }) => (
      <TableRowActions data={row.original} onPreview={setPreviewData} />
    ),
  },
]

export default function FundAProjectTable({
  serverTable,
  data,
  pageSizeOptions,
  filterOptions,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  fundListUrl,
}: FundAProjectTableProps) {
  const [previewData, setPreviewData] = useState<FundAProjectOutput | null>(
    null,
  )

  const getOptionalUser = useServerFn(getOptionalCurrentUser)
  const { data: authPayload } = useQuery({
    queryKey: ['optionalCurrentUser'],
    queryFn: () => getOptionalUser(),
  })
  const sessionUserId = authPayload?.currentUser.id ?? null

  const handlePreview = useCallback((row: FundAProjectOutput) => {
    setPreviewData(row)
  }, [])
  const columns = useMemo(
    () => createFundAProjectTableColumns(handlePreview),
    [handlePreview],
  )

  const { reactTable } = useDataTable({
    data: data.items,
    total: data.total,
    table: serverTable,
    columns,
    getRowId: (row) => row.id,
  })

  const renderMobileCard = useCallback(
    (row: FundAProjectOutput) => {
      const pct = fundedPercent(row.fundedAmount, row.targetAmount)
      const canEdit =
        sessionUserId !== null && sessionUserId === row.createdById
      return (
        <Card className="flex h-full cursor-pointer flex-col border-2 border-border pt-0 shadow-sm">
          <CardHeader className="p-0 relative h-68 border-b-2 border-border bg-muted flex items-center justify-center overflow-hidden space-y-0">
            {row.coverImageUrl ? (
              <img
                src={row.coverImageUrl}
                alt={row.coverImageAlt ?? row.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 z-0 size-full object-cover grayscale"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gray-200 grayscale opacity-50 mix-blend-multiply" />
                {(row.coverImageAlt ?? row.title) ? (
                  <span className="relative z-10 font-mono text-muted-foreground">
                    {row.coverImageAlt ?? row.title}
                  </span>
                ) : null}
              </>
            )}
            <Badge className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground border-2 border-border px-2 py-0.5 text-xs font-bold uppercase tracking-widest shadow-2xs rounded-none hover:bg-primary">
              {FUND_PROJECT_LEVEL_LABEL[row.projectLevel]}
            </Badge>

            {canEdit ? (
              <Button
                type="button"
                size="icon"
                className="absolute top-3 left-3 z-10 size-7"
                aria-label="Edit campaign"
                render={
                  <Link
                    to="/u/$uId/fund-a-project/$fundAProjectId/edit"
                    params={{
                      uId: row.createdById,
                      fundAProjectId: row.id,
                    }}
                  />
                }
              >
                <PencilIcon className="size-3.5" />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="p-5 pb-2 flex flex-col grow">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-8 h-8 rounded-none after:rounded-none border-2 border-border shadow-2xs">
                <AvatarFallback className="bg-blue-200 text-[10px] font-bold rounded-none">
                  {row.createdBy.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-tight">
                  {row.createdBy.name}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase">
                  {row.createdBy.studentMajor}
                </span>
              </div>
            </div>
            <h3 className="font-sans font-bold text-lg leading-tight uppercase mb-6 grow">
              {row.title}
            </h3>

            <div className="relative">
              <Progress
                value={pct}
                className="h-7 flex flex-col gap-0 overflow-hidden border-2 border-border bg-background shadow-2xs rounded-none"
                trackClassName="h-full min-h-0 rounded-none"
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold mix-blend-difference text-white pointer-events-none">
                {pct}% FUNDED
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-5 pb-5 pt-0 flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Target Goal
              </span>
              <span className="font-mono font-bold text-lg leading-none">
                ${row.targetAmount.toLocaleString()}
              </span>
            </div>
            <Button variant="outline">
              <Link to="/fund-a-project/$id" params={{ id: row.id }}>
                View Details
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )
    },
    [sessionUserId],
  )

  const serverToolbarExtras = useMemo(() => {
    if (!fundListUrl) return undefined
    return (
      <>
        <DataTableSimpleFilter
          title="Level"
          options={LEVEL_FILTER_OPTIONS}
          variant="multiple"
          values={fundListUrl.selectedLevels}
          onValuesChange={(ids) => fundListUrl.onLevelsChange(ids)}
        />
        <DataTableSimpleFilter
          title="Tags"
          options={fundListUrl.tagOptions}
          variant="multiple"
          values={fundListUrl.selectedTagIds}
          onValuesChange={fundListUrl.onTagIdsChange}
        />
        <div className="flex h-8 items-center gap-2 px-1">
          <Checkbox
            id="fund-a-project-featured-only"
            checked={fundListUrl.featuredOnly}
            onCheckedChange={(checked) =>
              fundListUrl.onFeaturedOnlyChange(checked === true)
            }
          />
          <Label
            htmlFor="fund-a-project-featured-only"
            className="text-xs font-medium whitespace-nowrap cursor-pointer"
          >
            Featured only
          </Label>
        </div>
      </>
    )
  }, [fundListUrl])

  const serverSort = useMemo(() => {
    if (!fundListUrl) return undefined
    return {
      value: fundListUrl.sort,
      options: FUND_LIST_SORT_OPTIONS,
      onChange: (v: string) =>
        fundListUrl.onSortChange(v as FundAPublicListSearch['sort']),
    }
  }, [fundListUrl])

  const listReset = useMemo(() => {
    if (!fundListUrl) return undefined
    return {
      active: fundListUrl.hasActiveFilters,
      onReset: fundListUrl.onResetList,
    }
  }, [fundListUrl])

  const filterPopoverMeta = useMemo(() => {
    if (!fundListUrl) return undefined
    const parts: Array<string> = []
    if (fundListUrl.selectedLevels.length > 0) {
      parts.push(
        fundListUrl.selectedLevels
          .map((l) => FUND_PROJECT_LEVEL_LABEL[l] ?? l)
          .join(', '),
      )
    }
    if (fundListUrl.selectedTagIds.length > 0) {
      const labels = fundListUrl.selectedTagIds.map(
        (id) => fundListUrl.tagOptions.find((t) => t.value === id)?.label ?? id,
      )
      parts.push(
        labels.length <= 3
          ? labels.join(', ')
          : `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`,
      )
    }
    if (fundListUrl.featuredOnly) {
      parts.push('Featured only')
    }
    const activeCount =
      fundListUrl.selectedLevels.length +
      fundListUrl.selectedTagIds.length +
      (fundListUrl.featuredOnly ? 1 : 0)
    return {
      summary: parts.length > 0 ? parts.join(' · ') : 'No filters applied yet.',
      activeCount,
    }
  }, [fundListUrl])

  return (
    <div>
      <DataTable
        columns={columns}
        data={data.items}
        externalTable={reactTable}
        tableSearchColumn="title"
        filterOptions={filterOptions}
        renderMobileCard={renderMobileCard}
        viewMode="mobile"
        rowCount={data.total}
        pageSizeOptions={pageSizeOptions}
        serverSearch={
          searchQuery !== undefined && onSearchQueryChange
            ? {
                value: searchQuery,
                onChange: onSearchQueryChange,
                ...(onSearchSubmit ? { onSubmit: onSearchSubmit } : {}),
              }
            : undefined
        }
        serverSort={serverSort}
        serverToolbarExtras={serverToolbarExtras}
        listReset={listReset}
        filterPopoverMeta={filterPopoverMeta}
      />
      <Sheet
        open={!!previewData}
        onOpenChange={(open) => !open && setPreviewData(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {previewData && (
            <>
              <SheetHeader>
                <SheetTitle>{previewData.title}</SheetTitle>
                <SheetDescription>
                  {previewData.subtitle || 'Project preview'}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-6">
                {previewData.coverImageUrl && (
                  <div className="mb-6 rounded-lg overflow-hidden border">
                    <img
                      src={previewData.coverImageUrl}
                      alt={previewData.coverImageAlt ?? previewData.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {FUND_PROJECT_LEVEL_LABEL[previewData.projectLevel]}
                    </Badge>
                    {previewData.isFeatured && (
                      <Badge variant="default">Featured</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Target Amount
                      </p>
                      <p className="text-2xl font-bold">
                        ${previewData.targetAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Funded Amount
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        ${previewData.fundedAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="font-semibold">
                        {Math.min(
                          100,
                          Math.round(
                            (previewData.fundedAmount /
                              previewData.targetAmount) *
                              100,
                          ),
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        100,
                        Math.round(
                          (previewData.fundedAmount /
                            previewData.targetAmount) *
                            100,
                        ),
                      )}
                      className="h-2"
                    />
                  </div>

                  {previewData.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {previewData.tags.map((tag) => (
                          <Badge key={tag.id} variant="outline">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {previewData.createdBy.name
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {previewData.createdBy.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {previewData.createdBy.studentMajor || 'Creator'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="gap-2">
                <SheetClose render={<Button variant="outline">Close</Button>} />
                <Button
                  render={
                    <Link
                      to="/fund-a-project/$id"
                      params={{ id: previewData.id }}
                    >
                      View Full Details
                    </Link>
                  }
                  variant="default"
                />
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function fundedPercent(funded: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((funded / target) * 100))
}

interface TableRowActionsProps {
  data: FundAProjectOutput
  onPreview: (data: FundAProjectOutput) => void
}
const TableRowActions = ({ data, onPreview }: TableRowActionsProps) => {
  return (
    <div className="flex h-full flex-row items-center justify-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <EllipsisIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent alignOffset={10} align="end" className="w-56">
          <Link to="/fund-a-project/$id" params={{ id: data.id }}>
            <DropdownMenuItem>
              <EyeIcon className="mr-2 h-4 w-4" /> <span>View</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem onClick={() => onPreview(data)}>
            <ViewIcon className="mr-2 h-4 w-4" /> <span>Preview</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
