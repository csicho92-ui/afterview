import { Archive, ArrowRight, Lock, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/Layout'
import { InterviewListItem } from '../components/InterviewListItem'
import { useInterviewStore } from '../hooks/useInterviewStore'

export function HomePage() {
  const { interviews } = useInterviewStore()
  const navigate = useNavigate()
  const recent = interviews.slice(0, 3)

  return (
    <AppShell>
      <section className="pb-10 pt-6 sm:pt-12">
        <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-sage">EVERY INTERVIEW LEAVES SOMETHING BEHIND</p>
        <h1 className="text-[34px] font-bold leading-[1.25] tracking-tight sm:text-5xl">
          면접이 끝나고,
          <br />
          무엇이 남았나요?
        </h1>
        <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
          기억나는 질문과 답변을 기록해 보세요. AI가 분석하기 좋은 회고 자료로 정리해 드립니다.
        </p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <button type="button" onClick={() => navigate('/interview/new')} className="btn-primary btn min-h-13 px-6 text-base">
            <Plus className="size-5" aria-hidden="true" /> 새 면접 기록하기
          </button>
          <Link to="/archive" className="btn-secondary btn min-h-13 px-5 text-base">
            <Archive className="size-5" aria-hidden="true" /> 기록 보관함
            {interviews.length > 0 && <span className="text-sm font-medium text-muted tabular-nums">{interviews.length}개</span>}
          </Link>
        </div>
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="recent-heading" className="text-sm font-semibold text-muted">최근 기록</h2>
            {interviews.length > 3 && (
              <Link to="/archive" className="inline-flex items-center gap-1 text-sm text-navy">
                전체 {interviews.length}개 보기 <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
          <ul className="space-y-3">
            {recent.map((iv) => (
              <InterviewListItem key={iv.id} iv={iv} />
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl bg-sage-soft/70 p-5 text-sm leading-relaxed text-[#46564a]">
        <p className="mb-1 flex items-center gap-1.5 font-semibold text-charcoal">
          <Lock className="size-4" aria-hidden="true" /> 기록은 이 브라우저에만 저장돼요
        </p>
        서버로 전송되지 않으며 회원가입도 필요 없어요. 대신 브라우저 데이터를 지우거나 기기를 바꾸면 기록이 사라질 수 있으니
        <Link to="/archive" className="mx-1 font-semibold text-navy underline underline-offset-2">기록 보관함</Link>
        에서 백업 파일을 내려받아 두세요. 공용 컴퓨터에서는 사용 후 기록을 삭제해 주세요.
      </section>
    </AppShell>
  )
}
