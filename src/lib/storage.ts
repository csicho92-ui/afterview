import { z } from 'zod'
import { interviewSchema, SCHEMA_VERSION, type Interview } from '../types/interview'

export const STORAGE_KEY = 'afterview:interviews'

const envelopeSchema = z.object({
  app: z.literal('afterview').optional(),
  schemaVersion: z.number(),
  interviews: z.array(z.unknown()),
})

export type LoadResult = { interviews: Interview[]; skipped: number }

/** 알 수 없는 데이터를 검증해 유효한 기록만 남긴다. */
export function parseInterviews(raw: unknown): LoadResult {
  const env = envelopeSchema.safeParse(raw)
  const list = env.success ? env.data.interviews : Array.isArray(raw) ? raw : null
  if (!list) throw new Error('AFTERVIEW 기록 형식이 아닙니다.')
  const interviews: Interview[] = []
  let skipped = 0
  for (const item of list) {
    const parsed = interviewSchema.safeParse(item)
    if (parsed.success) interviews.push(parsed.data)
    else skipped++
  }
  return { interviews, skipped }
}

export function loadInterviews(): LoadResult {
  let text: string | null = null
  try {
    text = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { interviews: [], skipped: 0 }
  }
  if (!text) return { interviews: [], skipped: 0 }
  try {
    return parseInterviews(JSON.parse(text))
  } catch {
    return { interviews: [], skipped: 0 }
  }
}

export type SaveError = 'quota' | 'unavailable'

export function saveInterviews(interviews: Interview[]): SaveError | null {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ app: 'afterview', schemaVersion: SCHEMA_VERSION, interviews }),
    )
    return null
  } catch (e) {
    const quota =
      e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    return quota ? 'quota' : 'unavailable'
  }
}
