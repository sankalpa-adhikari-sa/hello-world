import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  PlusCircleIcon,
  Settings2Icon,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  showToolbar?: boolean
  showPagination?: boolean
  showFilter?: boolean
  className?: string
}

const DEFAULT_PAGE_SIZES = [10, 20, 30, 40, 50] as const

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  showToolbar = true,
  showPagination = true,
  showFilter = true,
  className,
}) => {
  const renderToolbar = () => {
    if (!showToolbar) return null

    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search"
            className="h-8 w-[150px] lg:w-[250px]"
            aria-label="Search table"
          />
          {showFilter && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-dashed"
              aria-label="Add filter"
            >
              <PlusCircleIcon className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
          aria-label="View options"
        >
          <Settings2Icon className="h-4 w-4" />
          View
        </Button>
      </div>
    )
  }

  const renderTableHeader = () => {
    if (!showHeader) return null

    return (
      <TableHeader>
        <TableRow className="bg-sidebar rounded-lg border-none">
          {Array.from({ length: columns }).map((_, index) => (
            <TableHead key={`header-${index}`}>
              <Skeleton className="h-4" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
    )
  }

  const renderPagination = () => {
    if (!showPagination) return null

    return (
      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground flex-1 text-sm">
          0 of {rows} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={DEFAULT_PAGE_SIZES[0]} />
              </SelectTrigger>
              <SelectContent side="top">
                {DEFAULT_PAGE_SIZES.map((pageSize) => (
                  <SelectItem
                    key={`page-size-${pageSize}`}
                    value={`${pageSize}`}
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page 1 of 1
          </div>
          <PaginationControls />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex w-full flex-col space-y-2', className)}>
      {renderToolbar()}
      <div className="flex flex-col gap-2">
        <div className="w-full rounded-lg border">
          <Table>
            {renderTableHeader()}
            <TableBody className="border-t">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={`row-${rowIndex}`}>
                  <TableCell colSpan={columns} className="p-2">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {renderPagination()}
    </div>
  )
}

const PaginationControls: React.FC = () => (
  <div className="flex items-center space-x-2">
    <Button
      variant="outline"
      className="hidden h-8 w-8 p-0 lg:flex"
      aria-label="Go to first page"
    >
      <ChevronsLeftIcon className="h-4 w-4" />
    </Button>
    <Button
      variant="outline"
      className="h-8 w-8 p-0"
      aria-label="Go to previous page"
    >
      <ChevronLeftIcon className="h-4 w-4" />
    </Button>
    <Button
      variant="outline"
      className="h-8 w-8 p-0"
      aria-label="Go to next page"
    >
      <ChevronRightIcon className="h-4 w-4" />
    </Button>
    <Button
      variant="outline"
      className="hidden h-8 w-8 p-0 lg:flex"
      aria-label="Go to last page"
    >
      <ChevronsRightIcon className="h-4 w-4" />
    </Button>
  </div>
)

export default TableSkeleton
