import { SCHEMA_VERSION, type Interview } from '../types/interview'
import { parseInterviews } from './storage'

export function downloadText(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportBackup(interviews: Interview[]) {
  const stamp = new Date().toLocaleDateString('sv-SE')
  const body = JSON.stringify({ app: 'afterview', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), interviews }, null, 2)
  downloadText(`AFTERVIEW_backup_${stamp}.json`, body, 'application/json')
}

export async function readBackupFile(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('파일이 너무 큽니다 (최대 10MB).')
  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    throw new Error('JSON 파일을 읽을 수 없어요. AFTERVIEW에서 내보낸 백업 파일인지 확인해 주세요.')
  }
  const result = parseInterviews(raw)
  if (result.interviews.length === 0) throw new Error('불러올 수 있는 면접 기록이 없어요.')
  return result
}

/** 클립보드 복사. 실패하면 false를 돌려준다. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 아래 대체 방식으로 시도 */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}
