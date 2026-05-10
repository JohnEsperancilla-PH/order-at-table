'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * Keeps local state aligned with Server Component props when they change (e.g. after router.refresh()).
 */
export function useSyncedInitial<T>(initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial)
  useEffect(() => {
    setState(initial)
  }, [initial])
  return [state, setState]
}
