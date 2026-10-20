import { Download, Plus, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { InterviewListItem } from '../components/InterviewListItem'
import { AppShell, SaveIndicator } from '../components/Layout'
import { useInterviewStore } from '../hooks/useInterviewStore'
import { exportBackup, readBackupFile } from '../lib/exportData'

export function ArchivePage() {
  const { interviews, importMany } = useInterviewStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const { interviews: incoming, skipped } = await readBackupFile(file)
      const { added, replaced } = importMany(incoming)
      const parts = [`${added}개 추가`, replaced && `${replaced}개 갱신`, skipped && `${skipped}개는 형식이 맞지 않아 건너뜀`].filter(Boolean)
      setMessage({ tone: 'ok', text: `백업을 불러왔어요 (${parts.join(', ')}).` })
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : '파일을 불러오지 못했어요.' })
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">기록 보관함</h1>
          <p className="mt-1 text-muted">면접 기록 {interviews.length}개</p>
        </div>
        <SaveIndicator />
      </div>

      <section className="card mb-6 p-4 sm:p-5" aria-labelledby="backup-title">
        <h2 id="backup-title" className="font-semibold">백업과 복원</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          기록은 이 브라우저에만 저장돼요. 다른 기기로 옮기거나 브라우저 데이터를 지우기 전에 백업 파일을 내려받아 두세요.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-secondary btn text-sm" onClick={() => exportBackup(interviews)} disabled={!interviews.length}>
            <Download className="size-4" aria-hidden="true" /> JSON 백업 내려받기
          </button>
          <button type="button" className="btn-secondary btn text-sm" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" /> 백업 불러오기
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={onImport} aria-label="백업 파일 선택" tabIndex={-1} />
        </div>
        {message && (
          <p role={message.tone === 'error' ? 'alert' : 'status'} className={`mt-3 text-sm ${message.tone === 'error' ? 'text-terracotta' : 'text-sage'}`}>
            {message.text}
          </p>
        )}
      </section>

      {interviews.length ? (
        <ul className="space-y-3">
          {interviews.map((iv) => <InterviewListItem key={iv.id} iv={iv} manage />)}
        </ul>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-muted">아직 기록한 면접이 없어요.</p>
          <Link to="/interview/new" className="btn-primary btn mt-4">
            <Plus className="size-4" aria-hidden="true" /> 새 면접 기록하기
          </Link>
        </div>
      )}
    </AppShell>
  )
}
