import { ArrowRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell, StepFooter, StepHeader } from '../components/Layout'
import { useInterviewStore } from '../hooks/useInterviewStore'
import { FORMATS, STAGES, type Interview } from '../types/interview'
import { NotFound } from './NotFound'

const ATMOSPHERE_TAGS = ['차분한', '편안한', '대화형', '실무 중심', '압박감 있는', '형식적인', '시간이 촉박한']

type Form = Pick<Interview, 'company' | 'position' | 'date' | 'stage' | 'format' | 'atmosphereTags' | 'atmosphere'> & {
  interviewerCount: string
  durationMinutes: string
}

const toForm = (iv?: Interview): Form => ({
  company: iv?.company ?? '',
  position: iv?.position ?? '',
  date: iv?.date ?? new Date().toLocaleDateString('sv-SE'),
  stage: iv?.stage ?? '',
  format: iv?.format ?? '',
  atmosphereTags: iv?.atmosphereTags ?? [],
  atmosphere: iv?.atmosphere ?? '',
  interviewerCount: iv?.interviewerCount ? String(iv.interviewerCount) : '',
  durationMinutes: iv?.durationMinutes ? String(iv.durationMinutes) : '',
})

const toPositiveInt = (s: string) => {
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function InterviewSetupPage() {
  const { id } = useParams()
  const { getInterview, createNew, update } = useInterviewStore()
  const navigate = useNavigate()
  const existing = getInterview(id)
  const [form, setForm] = useState<Form>(() => toForm(existing))
  const [errors, setErrors] = useState<{ company?: string; position?: string }>({})

  if (id && !existing) return <NotFound />

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))
  const toggleTag = (t: string) =>
    set('atmosphereTags', form.atmosphereTags.includes(t) ? form.atmosphereTags.filter((x) => x !== t) : [...form.atmosphereTags, t])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = {
      company: form.company.trim() ? '' : '회사·기관명을 입력해 주세요.',
      position: form.position.trim() ? '' : '지원 직무를 입력해 주세요.',
    }
    if (next.company || next.position) {
      setErrors(next)
      document.getElementById(next.company ? 'company' : 'position')?.focus()
      return
    }
    const patch: Partial<Interview> = {
      ...form,
      company: form.company.trim(),
      position: form.position.trim(),
      interviewerCount: toPositiveInt(form.interviewerCount),
      durationMinutes: toPositiveInt(form.durationMinutes),
    }
    const targetId = existing?.id ?? createNew().id
    update(targetId, patch)
    navigate(`/interview/${targetId}/questions`)
  }

  return (
    <AppShell>
      <StepHeader step={1} title="어떤 면접이었나요?" description="회사와 직무만 적으면 바로 시작할 수 있어요. 나머지는 기억나는 만큼만 채워 주세요." />
      <form id="setup-form" onSubmit={submit} noValidate className="space-y-6">
        <section className="card space-y-5 p-4 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="company" className="field-label">
                회사·기관명 <span className="text-terracotta">*</span>
              </label>
              <input
                id="company"
                className="input"
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
                aria-invalid={Boolean(errors.company)}
                aria-describedby={errors.company ? 'company-err' : undefined}
                autoComplete="organization"
                autoFocus={!existing}
              />
              {errors.company && <p id="company-err" className="mt-1 text-sm text-terracotta">{errors.company}</p>}
            </div>
            <div>
              <label htmlFor="position" className="field-label">
                지원 직무 <span className="text-terracotta">*</span>
              </label>
              <input
                id="position"
                className="input"
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
                aria-invalid={Boolean(errors.position)}
                aria-describedby={errors.position ? 'position-err' : undefined}
              />
              {errors.position && <p id="position-err" className="mt-1 text-sm text-terracotta">{errors.position}</p>}
            </div>
          </div>
        </section>

        <section className="card space-y-5 p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-muted">선택 입력</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="date" className="field-label">면접 날짜</label>
              <input id="date" type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div>
              <label htmlFor="stage" className="field-label">면접 단계</label>
              <select id="stage" className="input" value={form.stage} onChange={(e) => set('stage', e.target.value as Form['stage'])}>
                <option value="">선택 안 함</option>
                {Object.entries(STAGES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="interviewerCount" className="field-label">면접관 수</label>
              <div className="relative">
                <input id="interviewerCount" type="number" inputMode="numeric" min={1} className="input pr-10" value={form.interviewerCount} onChange={(e) => set('interviewerCount', e.target.value)} />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">명</span>
              </div>
            </div>
            <div>
              <label htmlFor="duration" className="field-label">소요 시간</label>
              <div className="relative">
                <input id="duration" type="number" inputMode="numeric" min={1} className="input pr-10" value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">분</span>
              </div>
            </div>
          </div>

          <fieldset>
            <legend className="field-label">면접 방식</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {Object.entries(FORMATS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={form.format === k}
                  className="chip"
                  onClick={() => set('format', form.format === k ? '' : (k as Form['format']))}
                >
                  {v}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="field-label">면접 분위기</legend>
            <div className="flex flex-wrap gap-2">
              {ATMOSPHERE_TAGS.map((t) => (
                <button key={t} type="button" aria-pressed={form.atmosphereTags.includes(t)} className="chip" onClick={() => toggleTag(t)}>
                  {t}
                </button>
              ))}
            </div>
            <label htmlFor="atmosphere" className="sr-only">분위기 자유 입력</label>
            <input
              id="atmosphere"
              className="input mt-3"
              placeholder="직접 적기 (예: 질문 간 간격이 길었다)"
              value={form.atmosphere}
              onChange={(e) => set('atmosphere', e.target.value)}
            />
          </fieldset>
        </section>
      </form>
      <StepFooter>
        <button type="button" className="btn-ghost btn" onClick={() => navigate(existing ? `/interview/${existing.id}/questions` : '/')}>
          {existing ? '취소' : '처음으로'}
        </button>
        <button type="submit" form="setup-form" className="btn-primary btn px-5">
          질문 기록하기 <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </StepFooter>
    </AppShell>
  )
}
