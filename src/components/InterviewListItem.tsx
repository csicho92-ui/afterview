import { FileText, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInterviewStore } from '../hooks/useInterviewStore'
import { STAGES, type Interview } from '../types/interview'

const fmtDate = (d: string) => (d ? d.replaceAll('-', '.') : '')

/** 다음에 이어서 작성할 단계 */
function resumePath(iv: Interview) {
  if (!iv.questions.some((q) => q.question.trim())) return `/interview/${iv.id}/questions`
  if (iv.status === 'completed') return `/interview/${iv.id}/prompt`
  return `/interview/${iv.id}/reflection`
}

export function InterviewListItem({ iv, manage = false }: { iv: Interview; manage?: boolean }) {
  const { remove } = useInterviewStore()
  const [confirming, setConfirming] = useState(false)
  const count = iv.questions.filter((q) => q.question.trim()).length
  const meta = [fmtDate(iv.date), iv.stage && STAGES[iv.stage], `질문 ${count}개 기록`].filter(Boolean).join(' · ')

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {iv.company || '이름 없는 면접'} <span className="font-normal text-muted">/ {iv.position || '직무 미입력'}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{meta}</p>
        </div>
        <span className="flex shrink-0 gap-1">
          {iv.aiReview.savedAt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2.5 py-1 text-xs text-[#4d5e51]">
              <Sparkles className="size-3" aria-hidden="true" /> AI 회고
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs ${iv.status === 'completed' ? 'bg-navy/10 text-navy' : 'bg-terracotta-soft text-[#8f5a47]'}`}>
            {iv.status === 'completed' ? '정리 완료' : '작성 중'}
          </span>
        </span>
      </div>

      {confirming ? (
        <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-terracotta-soft px-3 py-2">
          <span className="text-sm">이 면접 기록 전체를 삭제할까요? 되돌릴 수 없어요.</span>
          <span className="flex gap-1">
            <button type="button" className="btn-ghost btn min-h-9 text-sm" onClick={() => setConfirming(false)}>취소</button>
            <button type="button" className="btn min-h-9 bg-terracotta text-sm text-white hover:bg-[#a96e5a]" onClick={() => remove(iv.id)}>삭제</button>
          </span>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link to={resumePath(iv)} className="btn-secondary btn min-h-10 text-sm">
            {iv.status === 'completed' ? '다시 보기' : '이어서 작성하기'}
          </Link>
          {count > 0 && (
            <Link to={`/interview/${iv.id}/prompt`} className="btn-ghost btn min-h-10 text-sm">
              <FileText className="size-4" aria-hidden="true" /> 프롬프트
            </Link>
          )}
          {manage && (
            <button type="button" className="btn-ghost btn ml-auto min-h-10 px-3 text-sm hover:text-terracotta" onClick={() => setConfirming(true)} aria-label={`${iv.company} 기록 삭제`}>
              <Trash2 className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">삭제</span>
            </button>
          )}
        </div>
      )}
    </li>
  )
}
