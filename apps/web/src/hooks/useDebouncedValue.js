import { useEffect, useState } from 'react'

/** Returns `value` after it has been stable for `delay` milliseconds. */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(timer)
  }, [delay, value])

  return debounced
}
