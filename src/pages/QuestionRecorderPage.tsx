import { ArrowLeft, ArrowRight, Pencil, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell, StepFooter, StepHeader } from '../components/Layout'
import { QuestionCard } from '../components/QuestionCard'
import { useInterviewStore } from '../hooks/useInterviewStore'
import { createQuestion, questionHasContent, STAGES, type Question } from '../types/interview'
import { NotFound } from './NotFound'

const renumber = (qs: Question[]) => qs.map((q, i) => ({ ...q, order: i + 1 }))

export function QuestionRecorderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getInterview, update } = useInterviewStore()
  const iv = getInterview(id)
  // 처음엔 마지막 카드(또는 비어 있는 첫 카드)를 펼친다.
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const qs = iv?.questions ?? []
    const target = qs.find((q) => !q.question.trim()) ?? qs[qs.length - 1]
    return new Set(target ? [target.id] : [])
  })
  const [focusId, setFocusId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const listEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!focusId) return
    document.getElementById(focusId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focusId])

  if (!iv) return <NotFound />

  const setQuestions = (fn: (qs: Question[]) => Question[]) =>
    update(iv.id, (prev) => ({ ...prev, questions: renumber(fn(prev.questions)) }))

  const addQuestion = (afterIndex?: number) => {
    const q = createQuestion()
    setQuestions((qs) => {
      const at = afterIndex === undefined ? qs.length : afterIndex + 1
      return [...qs.slice(0, at), q, ...qs.slice(at)]
    })
    setOpenIds(new Set([q.id]))
    setFocusId(q.id)
  }

  const toggle = (qid: string) =>
    setOpenIds((s) => {
      const n = new Set(s)
      if (n.has(qid)) n.delete(qid)
      else n.add(qid)
      return n
    })

  const filledCount = iv.questions.filter((q) => q.question.trim()).length
  const meta = [iv.stage && STAGES[iv.stage], iv.date].filter(Boolean).join(' · ')

  const goNext = () => {
    if (!iv.questions.some(questionHasContent)) {
      setNotice('질문을 하나 이상 기록하면 더 정확한 회고를 받을 수 있어요. 그래도 다음 단계로 넘어갈 수 있습니다.')
      if (notice) navigate(`/interview/${iv.id}/reflection`)
      return
    }
    // 빈 카드는 정리하고 넘어간다
    setQuestions((qs) => {
      const kept = qs.filter(questionHasContent)
      return kept.length ? kept : qs
    })
    navigate(`/interview/${iv.id}/reflection`)
  }

  return (
    <AppShell>
      <StepHeader
        step={2}
        title="면접에서 어떤 질문을 받았나요?"
        description="정확한 문장이 기억나지 않아도 괜찮아요. 기억나는 대로, 기억나는 순서대로 적어 주세요."
      />

      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-paper/60 px-4 py-3 text-sm">
        <p className="min-w-0 truncate">
          <span className="font-semibold">{iv.company}</span>
          <span className="text-muted"> / {iv.position}</span>
          {meta && <span className="ml-2 text-muted">· {meta}</span>}
        </p>
        <Link to={`/interview/${iv.id}/setup`} className="inline-flex shrink-0 items-center gap-1 text-muted hover:text-navy">
          <Pencil className="size-3.5" aria-hidden="true" /> 수정
        </Link>
      </div>

      <div className="space-y-3">
        {iv.questions.map((q, i) => (
          <div key={q.id} id={q.id} className="scroll-mt-20">
            <QuestionCard
              q={q}
              index={i}
              total={iv.questions.length}
              open={openIds.has(q.id)}
              autoFocus={focusId === q.id}
              onToggle={() => toggle(q.id)}
              onChange={(patch) => setQuestions((qs) => qs.map((x) => (x.id === q.id ? { ...x, ...patch } : x)))}
              onMove={(dir) =>
                setQuestions((qs) => {
                  const j = i + dir
                  if (j < 0 || j >= qs.length) return qs
                  const n = [...qs]
                  ;[n[i], n[j]] = [n[j], n[i]]
                  return n
                })
              }
              onDuplicate={() => {
                const copy = { ...q, id: createQuestion().id }
                setQuestions((qs) => [...qs.slice(0, i + 1), copy, ...qs.slice(i + 1)])
                setOpenIds(new Set([copy.id]))
                setFocusId(copy.id)
              }}
              onDelete={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
              onQuickAdd={() => addQuestion(i)}
            />
          </div>
        ))}
        <div ref={listEnd} />
      </div>

      <button
        type="button"
        onClick={() => addQuestion()}
        className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line font-semibold text-navy transition-colors hover:border-navy/40 hover:bg-paper"
      >
        <Plus className="size-5" aria-hidden="true" /> 질문 추가하기
      </button>
      <p className="mt-2 hidden text-center text-xs text-muted sm:block">
        입력 중 <kbd className="rounded border border-line bg-paper px-1">Ctrl</kbd>/<kbd className="rounded border border-line bg-paper px-1">⌘</kbd> + <kbd className="rounded border border-line bg-paper px-1">Enter</kbd> 로 다음 질문을 바로 추가할 수 있어요.
      </p>

      {notice && (
        <p role="alert" className="mt-4 rounded-xl bg-terracotta-soft px-4 py-3 text-sm">
          {notice}
        </p>
      )}

      <StepFooter>
        <button type="button" className="btn-ghost btn" onClick={() => navigate(`/interview/${iv.id}/setup`)}>
          <ArrowLeft className="size-4" aria-hidden="true" /> 이전
        </button>
        <span className="hidden text-sm text-muted sm:inline">질문 {filledCount}개 기록</span>
        <button type="button" className="btn-primary btn px-5" onClick={goNext}>
          {notice ? '그래도 다음으로' : '다음 단계'} <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </StepFooter>
    </AppShell>
  )
}
