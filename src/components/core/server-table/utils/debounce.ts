import { useEffect, useState } from 'react'

/**
 * Native debounce implementation
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: Array<any>) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * React hook for debounced callbacks
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @param deps - Dependencies array
 * @returns Debounced function
 */
export function useDebouncedCallback<T extends (...args: Array<any>) => any>(
  fn: T,
  delay: number = 300,
  deps: Array<unknown> = [],
): T {
  const [debouncedFn, setDebouncedFn] = useState<T>(() => debounce(fn, delay))

  useEffect(() => {
    setDebouncedFn(() => debounce(fn, delay))
  }, [fn, delay, ...deps])

  return debouncedFn
}
