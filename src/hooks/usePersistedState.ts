'use client'
import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export function blockHash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

export function usePersistedState<T>(
  cellKey: string,
  initial: T,
): [T, (v: T | ((p: T) => T)) => void] {
  const pathname = usePathname()
  const storageKey = `poo:${pathname}:${cellKey}`
  const [value, setRaw] = useState<T>(initial)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved !== null) setRaw(JSON.parse(saved) as T)
    } catch {}
  }, [storageKey])

  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      setRaw((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
        try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
        return next
      })
    },
    [storageKey],
  )

  return [value, set]
}
