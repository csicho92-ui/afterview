import { ArrowLeft, ArrowRight, Layers } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TextAreaField } from '../components/Fields'
import { AppShell, StepFooter, StepHeader } from '../components/Layout'
import { REFLECTION_CATEGORIES, visibleQuestions } from '../data/reflectionQuestions'
import { useInterviewStore } from '../hooks/useInterviewStore'
import { JOIN_INTENTIONS, type Reflection } from '../types/interview'
import { NotFound } from './NotFound'

export function ReflectionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getInterview, update } = useInterviewStore()
  const iv = getInterview(id)
  const [catIndex, setCatIndex] = useState(0)

  if (!iv) return <NotFound />

  const cats = REFLECTION_CATEGORIES.map((c) => ({ ...c, visible: visibleQuestions(c, iv) })).filter((c) => c.visible.length > 0)
  const idx = Math.min(catIndex, cats.length - 1)
  const cat = cats[idx]
  const totalVisible = cats.reduce((n, c) => n + c.visible.length, 0)
  const deepCount = REFLECTION_CATEGORIES.flatMap((c) => c.questions).filter((q) => !q.skipIf?.(iv)).length

  const setReflection = (patch: Partial<Reflection>) => update(iv.id, (p) => ({ ...p, reflection: { ...p.reflection, ...patch } }))
  const go = (i: number) => {
    setCatIndex(i)
    window.scrollTo({ top: 0 })
  }
  const toPrompt = () => navigate(`/interview/${iv.id}/prompt`)

  return (
    <AppShell>
      <StepHeader
        step={3}
        title="조금만 더 돌아볼까요?"
        description="질문·답변만으로는 놓치기 쉬운 감정과 맥락을 채워요. 모든 질문은 건너뛸 수 있어요."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="회고 단계" className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {cats.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => go(i)}
              aria-current={i === idx ? 'step' : undefined}
              className={`min-h-10 shrink-0 rounded-full px-3.5 text-sm transition-colors ${
                i === idx ? 'bg-navy font-semibold text-ivory' : 'text-muted hover:bg-charcoal/5'
              }`}
            >
              {c.title}
            </button>
          ))}
        </nav>
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            className="size-4 accent-navy"
            checked={iv.deepReflection}
            onChange={(e) => update(iv.id, { deepReflection: e.target.checked })}
          />
          <Layers className="size-4" aria-hidden="true" />
          더 깊이 회고하기{!iv.deepReflection && deepCount > totalVisible && ` (+${deepCount - totalVisible}문항)`}
        </label>
      </div>

      <section className="card space-y-6 p-4 sm:p-6" aria-labelledby="cat-title">
        <div>
          <h2 id="cat-title" className="text-lg font-bold">{cat.title}</h2>
          <p className="mt-1 text-sm text-muted">{cat.description}</p>
        </div>
        {cat.visible.map((q) =>
          q.key === 'joinIntention' ? (
            <fieldset key={q.key}>
              <legend className="field-label">{q.label}</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {Object.entries(JOIN_INTENTIONS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={iv.reflection.joinIntention === k}
                    className="chip"
                    onClick={() =>
                      setReflection({ joinIntention: iv.reflection.joinIntention === k ? '' : (k as Reflection['joinIntention']) })
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <TextAreaField
              key={q.key}
              label={q.label}
              value={iv.reflection[q.key]}
              onValueChange={(v) => setReflection({ [q.key]: v })}
              placeholder={q.placeholder}
              hint={q.hint?.(iv) ?? undefined}
              chips={q.chips}
              minRows={3}
            />
          ),
        )}
      </section>

      <button type="button" onClick={toPrompt} className="btn-ghost btn mt-4 w-full text-sm">
        나머지는 건너뛰고 프롬프트 만들기
      </button>

      <StepFooter>
        <button type="button" className="btn-ghost btn" onClick={() => (idx === 0 ? navigate(`/interview/${iv.id}/questions`) : go(idx - 1))}>
          <ArrowLeft className="size-4" aria-hidden="true" /> 이전
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {idx + 1} / {cats.length}
        </span>
        <button type="button" className="btn-primary btn px-5" onClick={() => (idx === cats.length - 1 ? toPrompt() : go(idx + 1))}>
          {idx === cats.length - 1 ? '프롬프트 만들기' : '다음'} <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </StepFooter>
    </AppShell>
  )
}
