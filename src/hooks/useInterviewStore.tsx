import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { loadInterviews, saveInterviews, type SaveError } from '../lib/storage'
import { createInterview, type Interview } from '../types/interview'

export type SaveStatus = 'idle' | 'saving' | 'saved' | SaveError

type Store = {
  interviews: Interview[]
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  getInterview: (id: string | undefined) => Interview | undefined
  createNew: () => Interview
  update: (id: string, patch: Partial<Interview> | ((prev: Interview) => Interview)) => void
  remove: (id: string) => void
  importMany: (incoming: Interview[]) => { added: number; replaced: number }
}

const StoreContext = createContext<Store | null>(null)

export function InterviewStoreProvider({ children }: { children: ReactNode }) {
  const [interviews, setInterviews] = useState<Interview[]>(() => loadInterviews().interviews)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const first = useRef(true)
  const latest = useRef(interviews)

  // 입력이 멈추면 자동 저장한다.
  useEffect(() => {
    latest.current = interviews
    if (first.current) {
      first.current = false
      return
    }
    setSaveStatus('saving')
    const t = window.setTimeout(() => {
      const err = saveInterviews(interviews)
      setSaveStatus(err ?? 'saved')
      if (!err) setLastSavedAt(new Date())
    }, 350)
    return () => window.clearTimeout(t)
  }, [interviews])

  // 탭을 닫거나 숨기는 순간에도 즉시 저장한다.
  useEffect(() => {
    const flush = () => saveInterviews(latest.current)
    const onVis = () => document.visibilityState === 'hidden' && flush()
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const getInterview = useCallback((id: string | undefined) => interviews.find((i) => i.id === id), [interviews])

  const createNew = useCallback(() => {
    const iv = createInterview()
    setInterviews((list) => [iv, ...list])
    return iv
  }, [])

  const update = useCallback<Store['update']>((id, patch) => {
    setInterviews((list) =>
      list.map((iv) => {
        if (iv.id !== id) return iv
        const next = typeof patch === 'function' ? patch(iv) : { ...iv, ...patch }
        return { ...next, updatedAt: new Date().toISOString() }
      }),
    )
  }, [])

  const remove = useCallback((id: string) => setInterviews((list) => list.filter((i) => i.id !== id)), [])

  const importMany = useCallback((incoming: Interview[]) => {
    const existing = new Set(latest.current.map((i) => i.id))
    const replaced = incoming.filter((i) => existing.has(i.id)).length
    setInterviews((list) => {
      const map = new Map(list.map((i) => [i.id, i]))
      for (const iv of incoming) map.set(iv.id, iv)
      return [...map.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    })
    return { added: incoming.length - replaced, replaced }
  }, [])

  const value = useMemo(
    () => ({ interviews, saveStatus, lastSavedAt, getInterview, createNew, update, remove, importMany }),
    [interviews, saveStatus, lastSavedAt, getInterview, createNew, update, remove, importMany],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useInterviewStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('InterviewStoreProvider가 필요합니다.')
  return ctx
}
