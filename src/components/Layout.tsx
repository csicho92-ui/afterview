import { Archive, Check, CloudOff, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useInterviewStore } from '../hooks/useInterviewStore'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md text-[15px] font-bold tracking-[0.18em] text-navy">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path d="M9 22 16 9l7 13" fill="none" stroke="#F8F7F4" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="19" r="1.8" fill="#849889" />
      </svg>
      AFTERVIEW
    </Link>
  )
}

export function SaveIndicator() {
  const { saveStatus } = useInterviewStore()
  const map = {
    idle: null,
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: '저장 중', cls: 'text-muted' },
    saved: { icon: <Check className="size-3.5" />, text: '이 브라우저에 저장됨', cls: 'text-sage' },
    quota: { icon: <CloudOff className="size-3.5" />, text: '저장 공간 부족 — 백업 후 오래된 기록을 정리해 주세요', cls: 'text-terracotta' },
    unavailable: { icon: <CloudOff className="size-3.5" />, text: '저장할 수 없는 환경이에요 (시크릿 모드 등)', cls: 'text-terracotta' },
  }[saveStatus]
  return (
    <p role="status" aria-live="polite" className={`flex min-h-5 items-center gap-1 text-xs ${map?.cls ?? ''}`}>
      {map?.icon}
      {map?.text}
    </p>
  )
}

/** 어느 화면에서든 눈에 띄는 기록 보관함 버튼 (기록 개수 표시) */
function ArchiveButton() {
  const { interviews } = useInterviewStore()
  return (
    <NavLink
      to="/archive"
      className={({ isActive }) =>
        `btn min-h-10 gap-1.5 px-3.5 text-sm ${isActive ? 'bg-navy text-ivory' : 'border border-navy/25 bg-paper text-navy hover:border-navy hover:bg-navy/[0.04]'}`
      }
    >
      <Archive className="size-4" aria-hidden="true" />
      기록 보관함
      {interviews.length > 0 && (
        <span className="ml-0.5 min-w-5 rounded-full bg-sage-soft px-1.5 text-center text-xs font-bold leading-5 text-[#3f4f43] tabular-nums">
          {interviews.length}
        </span>
      )}
    </NavLink>
  )
}

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Logo />
          <ArchiveButton />
        </div>
      </header>
      <main className={`mx-auto px-4 pb-32 pt-6 sm:pt-10 ${wide ? 'max-w-4xl' : 'max-w-3xl'}`}>{children}</main>
    </div>
  )
}

const STEPS = ['기본 정보', '질문 기록', '회고', '프롬프트']

export function StepHeader({ step, title, description }: { step: 1 | 2 | 3 | 4; title: string; description?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.14em] text-navy">
          STEP {step} / 4 <span className="ml-1 font-medium tracking-normal text-muted">· {STEPS[step - 1]}</span>
        </p>
        <SaveIndicator />
      </div>
      <div className="mb-6 flex gap-1.5" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-navy' : 'bg-line'}`} />
        ))}
      </div>
      <h1 className="text-2xl font-bold leading-snug sm:text-[28px]">{title}</h1>
      {description && <p className="mt-2 leading-relaxed text-muted">{description}</p>}
    </div>
  )
}

/** 화면 하단에 고정되는 이전/다음 버튼 영역 */
export function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">{children}</div>
    </div>
  )
}
