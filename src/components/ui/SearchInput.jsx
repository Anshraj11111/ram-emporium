import { Search, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

/**
 * Search input with built-in debounce.
 * `onChange` fires only after `debounce` ms of no typing (default 300ms).
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  debounce = 300,
}) {
  const [localValue, setLocalValue] = useState(value || '')
  const inputRef = useRef()
  const timerRef = useRef()

  // Sync external value changes (e.g., reset)
  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const handleChange = (e) => {
    const v = e.target.value
    setLocalValue(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), debounce)
  }

  const handleClear = () => {
    setLocalValue('')
    clearTimeout(timerRef.current)
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={`search-bar ${className || ''}`}>
      <Search size={16} className="search-icon" />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="glass-input"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
