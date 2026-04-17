'use client'

import { useMemo } from 'react'
import { FilterIcon } from 'lucide-react'
import type { Column } from '@tanstack/react-table'

import { buttonVariants } from '@/components/ui/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { cn } from '@/lib/utils'

interface DataTableSimpleFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title: string
  options: Array<{
    label: string
    value: string
  }>
  variant?: 'multiple' | 'single'
  /**
   * Controlled multi-select without a TanStack column (e.g. URL + server fetch).
   * When both are set, `column` is ignored for the multiple UI.
   */
  values?: Array<string>
  onValuesChange?: (values: Array<string>) => void
}

function optionLabel(
  options: Array<{ label: string; value: string }>,
  value: string,
) {
  return options.find((o) => o.value === value)?.label ?? value
}

function SimpleFilterMultipleCombo({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: Array<{ label: string; value: string }>
  value: Array<string>
  onChange: (next: Array<string>) => void
}) {
  const anchor = useComboboxAnchor()
  const items = useMemo(() => options.map((o) => o.value), [options])
  const selectedValues = new Set(value)
  const hasActiveFilters = selectedValues.size > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium whitespace-nowrap">
          {title}
        </span>
        {hasActiveFilters ? (
          <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
            {selectedValues.size}
          </span>
        ) : null}
        <Combobox
          multiple
          autoHighlight
          items={items}
          value={value}
          onValueChange={(next) => {
            const list = (next ?? [])
            onChange(list)
          }}
        >
          <ComboboxChips ref={anchor} className="w-full max-w-xs">
            <ComboboxValue>
              {(values: Array<string>) => (
                <>
                  {values.map((v) => (
                    <ComboboxChip key={v}>
                      {optionLabel(options, v)}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    placeholder={values.length === 0 ? 'Search or add…' : ''}
                    className="text-xs"
                  />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent
            anchor={anchor}
            align="start"
            className="min-w-(--anchor-width)"
          >
            <ComboboxEmpty>No matches.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {optionLabel(options, item)}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      {hasActiveFilters ? (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-muted-foreground hover:text-foreground shrink-0 text-xs font-medium underline-offset-4 hover:underline"
        >
          Clear
        </button>
      ) : null}
    </div>
  )
}

export function DataTableSimpleFilter<TData, TValue>({
  column,
  title,
  options,
  variant = 'multiple',
  values: controlledValues,
  onValuesChange,
}: DataTableSimpleFilterProps<TData, TValue>) {
  const useControlledMultiple =
    controlledValues !== undefined && onValuesChange !== undefined

  if (useControlledMultiple) {
    return (
      <SimpleFilterMultipleCombo
        title={title}
        options={options}
        value={controlledValues}
        onChange={onValuesChange}
      />
    )
  }

  if (variant === 'single') {
    const filterValue = column?.getFilterValue()
    const singleValue =
      typeof filterValue === 'string' && filterValue ? filterValue : null

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Combobox
          value={singleValue}
          onValueChange={(next) => {
            column?.setFilterValue(
              next == null || next === '' ? undefined : next,
            )
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium whitespace-nowrap">
              {title}
            </span>
            <ComboboxInput
              placeholder="Search or pick…"
              showClear={Boolean(singleValue)}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'h-8 min-w-[140px] max-w-[220px] border-dashed shadow-none',
              )}
            />
          </div>
          <ComboboxContent align="start" className="min-w-(--anchor-width)">
            <ComboboxEmpty>No matches.</ComboboxEmpty>
            <ComboboxList>
              {options.map((option) => (
                <ComboboxItem key={option.value} value={option.value}>
                  {option.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    )
  }

  const filterValue = column?.getFilterValue()
  const fromColumn = Array.from(new Set((filterValue as Array<string>) || []))

  return (
    <SimpleFilterMultipleCombo
      title={title}
      options={options}
      value={fromColumn}
      onChange={(next) =>
        column?.setFilterValue(next.length > 0 ? next : undefined)
      }
    />
  )
}
