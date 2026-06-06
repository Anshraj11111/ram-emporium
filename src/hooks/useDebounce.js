import { useState, useEffect } from 'react'

/**
 * Debounces a value — waits `delay` ms after the last change before updating.
 * Perfect for search inputs to avoid hammering the API on every keystroke.
 *
 * @param {any}    value  The value to debounce
 * @param {number} delay  Milliseconds to wait (default 300)
 */
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
