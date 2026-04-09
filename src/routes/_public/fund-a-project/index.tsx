'use client'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { FilterIcon, SearchIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

import LandingPageHero from '@/components/core/cards/landing'
import { FundmeCard } from '@/components/core/fund-a-project/fund-a-project-card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  fundAPublicListSearchSchema,
  getFundAProjects,
} from '@/sfn/fund-a-project'
import { listTagsForRequestsFormQO } from '@/sfn/requests'
import { getOptionalCurrentUser } from '@/sfn/users'
import {
  FUND_PROJECT_LEVEL_KEYS,
  FUND_PROJECT_LEVEL_LABEL,
} from '@/types/fund-a-project'

function cardAffiliationLine(createdBy: {
  studentMajor: string | null
}): string {
  if (!createdBy.studentMajor) return ''
  return createdBy.studentMajor.trim()
}

function fundedPercent(funded: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((funded / target) * 100))
}

const LEVEL_VALUE_SET = new Set<string>(FUND_PROJECT_LEVEL_KEYS)

function parseCommaList(raw: string | undefined): Array<string> {
  if (!raw?.trim()) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function filterValidTagIds(raw: string | undefined): Array<string> {
  return parseCommaList(raw).filter((id) => z.uuid().safeParse(id).success)
}

function filterValidLevels(raw: string | undefined): Array<string> {
  return parseCommaList(raw).filter((v) => LEVEL_VALUE_SET.has(v))
}

function buildLevelsParam(selected: Array<string>): string | undefined {
  return selected.length ? selected.join(',') : undefined
}

export const Route = createFileRoute('/_public/fund-a-project/')({
  validateSearch: (raw) => fundAPublicListSearchSchema.parse(raw),
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const navigateGlobal = useNavigate()
  const search = Route.useSearch()
  const getFundAProjectsSfn = useServerFn(getFundAProjects)
  const getOptionalUser = useServerFn(getOptionalCurrentUser)

  const [queryDraft, setQueryDraft] = useState(search.q ?? '')

  useEffect(() => {
    setQueryDraft(search.q ?? '')
  }, [search.q])

  const tagIds = useMemo(() => filterValidTagIds(search.tags), [search.tags])
  const levelValues = useMemo(
    () => filterValidLevels(search.levels),
    [search.levels],
  )

  const listQueryInput = useMemo(
    () => ({
      page: search.page,
      limit: search.pageSize,
      searchParam: {
        query: search.q,
        sort: search.sort,
        tagIds: tagIds.length ? tagIds : undefined,
        featuredOnly: search.featured === true,
        projectLevels: levelValues.length > 0 ? levelValues : undefined,
      },
    }),
    [
      search.page,
      search.pageSize,
      search.q,
      search.sort,
      search.featured,
      tagIds,
      levelValues,
    ],
  )

  const { data: authPayload } = useQuery({
    queryKey: ['optionalCurrentUser'],
    queryFn: () => getOptionalUser(),
  })

  const sessionUserId = authPayload?.currentUser?.id ?? null

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ['fund-a-projects', 'list', listQueryInput],
    queryFn: () => getFundAProjectsSfn({ data: listQueryInput }),
  })

  useEffect(() => {
    if (!data || data.page === search.page) return
    navigate({
      search: (prev) => ({ ...prev, page: data.page }),
      replace: true,
    })
  }, [data, navigate, search.page])

  const projects = data?.items ?? []
  const total = data?.total ?? 0
  const page = data?.page ?? search.page
  const pageSize = data?.pageSize ?? search.pageSize
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const tagsQuery = useQuery(listTagsForRequestsFormQO())

  const setSearch = (
    patch: Partial<z.infer<typeof fundAPublicListSearchSchema>>,
  ) => {
    navigate({
      search: (prev) => ({ ...prev, ...patch }),
    })
  }

  const applySearchQuery = () => {
    const trimmed = queryDraft.trim()
    setSearch({
      q: trimmed || undefined,
      page: 1,
    })
  }

  const toggleTagId = (id: string, checked: boolean) => {
    const next = new Set(tagIds)
    if (checked) next.add(id)
    else next.delete(id)
    const list = [...next]
    setSearch({
      tags: list.length ? list.join(',') : undefined,
      page: 1,
    })
  }

  const toggleLevel = (value: string, checked: boolean) => {
    const next = new Set(levelValues)
    if (checked) next.add(value)
    else next.delete(value)
    const list = [...next]
    setSearch({
      levels: buildLevelsParam(list),
      page: 1,
    })
  }

  const clearFilters = () => {
    setQueryDraft('')
    navigate({
      search: {
        ...search,
        page: 1,
        q: undefined,
        tags: undefined,
        levels: undefined,
        featured: undefined,
      },
    })
  }

  const pageNumbers = useMemo(() => {
    const windowSize = 5
    const half = Math.floor(windowSize / 2)
    let start = Math.max(1, page - half)
    const end = Math.min(totalPages, start + windowSize - 1)
    start = Math.max(1, end - windowSize + 1)
    const nums: Array<number> = []
    for (let i = start; i <= end; i += 1) nums.push(i)
    return nums
  }, [page, totalPages])

  const hasActiveFilters = Boolean(
    search.q?.trim() ||
    tagIds.length ||
    levelValues.length ||
    search.featured === true,
  )

  return (
    <div>
      <LandingPageHero />
      <article className="space-y-4 p-3 lg:p-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {sessionUserId ? (
            <Button
              className="cursor-pointer"
              onClick={() =>
                navigateGlobal({
                  to: '/u/$uId/fund-a-project/new',
                  params: { uId: sessionUserId },
                })
              }
            >
              New campaign
            </Button>
          ) : null}
        </div>

        <div className="border-b-3 flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
          <h1 className="text-lg font-bold uppercase">Projects</h1>
          <span className="text-primary text-lg font-bold">
            {isPending ? (
              '…'
            ) : (
              <>
                {total.toLocaleString()}
                <span className="text-muted-foreground ml-1 text-sm font-normal">
                  total
                </span>
              </>
            )}
          </span>
        </div>

        <div className="bg-muted/40 flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:flex-wrap md:items-end md:gap-4 md:p-4">
          <div className="min-w-0 flex-1 md:min-w-[240px]">
            <Label
              htmlFor="fund-search"
              className="mb-1.5 hidden text-sm font-medium md:block"
            >
              Search
            </Label>
            <div className="flex gap-1.5 md:gap-2">
              <div className="relative min-w-0 flex-1">
                <SearchIcon
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 md:left-2"
                  aria-hidden
                />
                <Input
                  id="fund-search"
                  value={queryDraft}
                  onChange={(e) => setQueryDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applySearchQuery()
                  }}
                  placeholder="Search title or subtitle…"
                  className="h-8 pl-8 text-sm md:h-7"
                  autoComplete="off"
                  aria-label="Search campaigns by title or subtitle"
                />
              </div>
              <Button
                type="button"
                size="icon"
                className="size-8 shrink-0 md:hidden"
                onClick={applySearchQuery}
                aria-label="Run search"
              >
                <SearchIcon className="size-3.5" />
              </Button>
              <Button
                type="button"
                onClick={applySearchQuery}
                className="hidden shrink-0 md:inline-flex"
              >
                Search
              </Button>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-row items-stretch gap-1.5 md:w-auto md:gap-4">
            <div className="min-w-0 flex-1 md:min-w-[180px] md:flex-none">
              <Label
                htmlFor="fund-sort"
                className="mb-1.5 hidden text-sm font-medium md:block"
              >
                Sort
              </Label>
              <Select
                value={search.sort}
                onValueChange={(v) =>
                  setSearch({
                    sort: v as 'newest' | 'oldest' | 'urgent',
                    page: 1,
                  })
                }
              >
                <SelectTrigger
                  id="fund-sort"
                  className="h-8 w-full min-w-0 max-md:text-xs md:h-7 md:w-[200px]"
                  aria-label="Sort campaigns"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="urgent">
                    Most urgent (least funded)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[4.25rem] shrink-0 md:w-auto md:min-w-[140px]">
              <Label
                htmlFor="fund-page-size"
                className="mb-1.5 hidden text-sm font-medium md:block"
              >
                Per page
              </Label>
              <Select
                value={String(search.pageSize)}
                onValueChange={(v) =>
                  setSearch({
                    pageSize: Number(v),
                    page: 1,
                  })
                }
              >
                <SelectTrigger
                  id="fund-page-size"
                  className="h-8 w-full px-2 max-md:text-xs md:h-7 md:w-[140px]"
                  aria-label="Results per page"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[8, 12, 24, 36].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex shrink-0 flex-col justify-end md:justify-start">
              <span className="mb-1.5 hidden h-5 md:block" aria-hidden />
              <Popover>
                <PopoverTrigger
                  type="button"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'relative size-8 gap-0 p-0 md:size-auto md:h-7 md:gap-1.5 md:px-2',
                  )}
                  aria-label={
                    hasActiveFilters
                      ? 'Filters (active)'
                      : 'Open level, tag, and featured filters'
                  }
                >
                  <FilterIcon className="size-3.5" />
                  <span className="hidden md:inline">Filters</span>
                  {hasActiveFilters ? (
                    <>
                      <span className="bg-primary absolute top-1 right-1 size-1.5 rounded-full md:hidden" />
                      <span className="bg-primary text-primary-foreground ml-0.5 hidden rounded-full px-1.5 py-0 text-[10px] md:inline">
                        on
                      </span>
                    </>
                  ) : null}
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-medium">Project level</p>
                      <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                        {FUND_PROJECT_LEVEL_KEYS.map((key) => (
                          <label
                            key={key}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={levelValues.includes(key)}
                              onCheckedChange={(c) =>
                                toggleLevel(key, c === true)
                              }
                            />
                            <span>{FUND_PROJECT_LEVEL_LABEL[key]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={search.featured === true}
                          onCheckedChange={(c) =>
                            setSearch({
                              featured: c === true ? true : undefined,
                              page: 1,
                            })
                          }
                        />
                        <span>Featured only</span>
                      </label>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium">Tags</p>
                      {tagsQuery.isLoading ? (
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                          <Spinner />
                          Loading tags…
                        </div>
                      ) : tagsQuery.data?.length ? (
                        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                          {tagsQuery.data.map((t) => (
                            <label
                              key={t.id}
                              className="flex cursor-pointer items-center gap-2 text-sm"
                            >
                              <Checkbox
                                checked={tagIds.includes(t.id)}
                                onCheckedChange={(c) =>
                                  toggleTagId(t.id, c === true)
                                }
                              />
                              <span>{t.name}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          No tags yet.
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={clearFilters}
                      disabled={!hasActiveFilters && !queryDraft.trim()}
                    >
                      Clear search & filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {isPending ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner />
            Loading projects…
          </p>
        ) : null}
        {isError ? (
          <p className="text-destructive text-sm">
            Could not load projects. Try again later.
          </p>
        ) : null}

        {isFetching && !isPending ? (
          <p className="text-muted-foreground text-xs">Updating…</p>
        ) : null}

        {!isPending && !isError && projects.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No campaigns match your filters. Try adjusting search or filters.
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((p) => {
            const pct = fundedPercent(p.fundedAmount, p.targetAmount)
            const isOwner = Boolean(
              sessionUserId && p.createdById === sessionUserId,
            )
            const legacyImage = p.coverImageUrl?.trim()
            const trimmedAlt = p.coverImageAlt?.trim()
            const imageAlt = trimmedAlt || (legacyImage ? p.title : undefined)

            const card = {
              badge: FUND_PROJECT_LEVEL_LABEL[p.projectLevel],
              name:
                p.createdBy.displayName?.trim() ||
                p.createdBy.name ||
                'Creator',
              dept: cardAffiliationLine(p.createdBy),
              title: p.title,
              progress: pct,
              target: p.targetAmount,
              imageUrl: legacyImage || undefined,
              imageAlt,
              imagePlaceholderText: p.tags[0]?.name,
            }

            return (
              <FundmeCard
                key={p.id}
                {...card}
                onCardClick={() =>
                  navigateGlobal({
                    to: '/fund-a-project/$id',
                    params: { id: p.id },
                  })
                }
                onViewDetails={() =>
                  navigateGlobal({
                    to: '/fund-a-project/$id',
                    params: { id: p.id },
                  })
                }
                onEdit={
                  isOwner
                    ? () =>
                        navigateGlobal({
                          to: '/u/$uId/fund-a-project/$fundAProjectId/edit',
                          params: {
                            uId: sessionUserId!,
                            fundAProjectId: p.id,
                          },
                        })
                    : undefined
                }
              />
            )
          })}
        </div>

        {!isPending && !isError && total > 0 ? (
          <Pagination className="pt-2">
            <PaginationContent className="flex-wrap justify-center gap-1">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={cn(page <= 1 && 'pointer-events-none opacity-40')}
                  onClick={(e) => {
                    e.preventDefault()
                    if (page <= 1) return
                    setSearch({ page: page - 1 })
                  }}
                />
              </PaginationItem>
              {pageNumbers[0] > 1 ? (
                <>
                  <PaginationItem>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setSearch({ page: 1 })}
                    >
                      1
                    </Button>
                  </PaginationItem>
                  {pageNumbers[0] > 2 ? (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : null}
                </>
              ) : null}
              {pageNumbers.map((n) => (
                <PaginationItem key={n}>
                  <Button
                    type="button"
                    variant={n === page ? 'outline' : 'ghost'}
                    size="icon"
                    className="size-8"
                    aria-current={n === page ? 'page' : undefined}
                    onClick={() => setSearch({ page: n })}
                  >
                    {n}
                  </Button>
                </PaginationItem>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages ? (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 ? (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : null}
                  <PaginationItem>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setSearch({ page: totalPages })}
                    >
                      {totalPages}
                    </Button>
                  </PaginationItem>
                </>
              ) : null}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={cn(
                    page >= totalPages && 'pointer-events-none opacity-40',
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    if (page >= totalPages) return
                    setSearch({ page: page + 1 })
                  }}
                />
              </PaginationItem>
            </PaginationContent>
            <p className="text-muted-foreground mt-2 text-center text-xs">
              Page {page} of {totalPages} · Showing {projects.length} of{' '}
              {total.toLocaleString()}
            </p>
          </Pagination>
        ) : null}
      </article>
    </div>
  )
}
