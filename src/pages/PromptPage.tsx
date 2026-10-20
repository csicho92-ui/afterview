import { AlertTriangle, ArrowLeft, Check, Copy, Download, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AutoTextarea } from '../components/Fields'
import { AppShell, StepFooter, StepHeader } from '../components/Layout'
import { useInterviewStore } from '../hooks/useInterviewStore'
import { copyText, downloadText } from '../lib/exportData'
import { assessRecord, buildMarkdownExport, buildPromptSteps, detectSensitive, orderedModes, promptFileName, type PromptStep } from '../lib/promptBuilder'
import { ANALYSIS_MODES, DEPTHS, TONES, type AnalysisMode, type AnalysisSettings } from '../types/interview'
import { NotFound } from './NotFound'

const AI_LINKS = [
  { name: 'ChatGPT', href: 'https://chatgpt.com/' },
  { name: 'Claude', href: 'https://claude.ai/new' },
  { name: 'Gemini', href: 'https://gemini.google.com/app' },
]

type CopyState = 'idle' | 'copied' | 'failed'

export function PromptPage() {
  const { id } = useParams()
  const { getInterview, update } = useInterviewStore()
  const iv = getInterview(id)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [expanded, setExpanded] = useState(false)
  const previewRef = useRef<HTMLTextAreaElement>(null)

  const steps = useMemo(() => (iv ? buildPromptSteps(iv) : []), [iv])
  const prompt = steps[0]?.text ?? ''
  const assessment = useMemo(() => (iv ? assessRecord(iv) : null), [iv])
  const sensitive = useMemo(() => detectSensitive(prompt), [prompt])

  if (!iv || !assessment) return <NotFound />

  const settings = iv.analysisSettings
  const setSettings = (patch: Partial<AnalysisSettings>) => {
    update(iv.id, (p) => ({ ...p, analysisSettings: { ...p.analysisSettings, ...patch } }))
    setCopyState('idle')
  }
  const toggleMode = (m: AnalysisMode) => {
    const current = orderedModes(settings.modes)
    const has = current.includes(m)
    if (has && current.length === 1) return // 최소 1개 유지
    // 고른 순서가 곧 분석 순서다. 첫 번째가 주 분석.
    setSettings({ modes: has ? current.filter((x) => x !== m) : [...current, m] })
  }

  const markCompleted = () => iv.status !== 'completed' && update(iv.id, { status: 'completed' })

  const onCopy = async () => {
    const ok = await copyText(prompt)
    setCopyState(ok ? 'copied' : 'failed')
    if (ok) markCompleted()
    else {
      setExpanded(true)
      requestAnimationFrame(() => {
        previewRef.current?.focus()
        previewRef.current?.select()
      })
    }
  }

  const onDownload = () => {
    downloadText(promptFileName(iv), buildMarkdownExport(iv), 'text/markdown')
    markCompleted()
  }

  const modeOrder = orderedModes(settings.modes)
  const primaryLabel = ANALYSIS_MODES[modeOrder[0]].label
  const modeLabels = modeOrder.length > 1 ? `${primaryLabel} 외 ${modeOrder.length - 1}` : primaryLabel

  return (
    <AppShell>
      <StepHeader
        step={4}
        title="기억을 정리했어요."
        description="입력한 면접 경험으로 AI 회고용 프롬프트를 만들었어요. 내용을 확인한 뒤 복사해서 사용하는 AI에 붙여넣어 주세요."
      />

      <dl className="mb-6 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-paper text-center">
        <div className="px-2 py-4">
          <dt className="text-xs text-muted">면접 질문</dt>
          <dd className="mt-1 text-xl font-bold">{assessment.questionCount}개</dd>
        </div>
        <div className="px-2 py-4">
          <dt className="text-xs text-muted">회고 메모</dt>
          <dd className="mt-1 text-xl font-bold">{assessment.reflectionCount}개</dd>
        </div>
        <div className="px-2 py-4">
          <dt className="text-xs text-muted">분석</dt>
          <dd className="mt-1.5 truncate text-sm font-semibold" title={modeLabels}>{modeLabels}</dd>
        </div>
      </dl>

      {assessment.warnings.length > 0 && (
        <div className="mb-6 rounded-2xl bg-terracotta-soft p-4 text-sm leading-relaxed" role="note">
          <p className="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-4 text-terracotta" aria-hidden="true" /> 기록이 적으면 분석이 불확실해질 수 있어요
          </p>
          <ul className="list-disc pl-5 text-[#6e4a3d]">
            {assessment.warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
          <p className="mt-2 text-[#6e4a3d]">이 한계는 프롬프트에도 함께 적어 두었어요.{' '}
            <Link to={`/interview/${iv.id}/questions`} className="font-semibold underline underline-offset-2">질문 더 기록하기</Link>
          </p>
        </div>
      )}

      <section className="card mb-6 space-y-5 p-4 sm:p-6" aria-labelledby="settings-title">
        <h2 id="settings-title" className="text-lg font-bold">어떤 회고를 받고 싶나요?</h2>
        <fieldset>
          <legend className="field-label">분석 목적</legend>
          <p className="-mt-0.5 mb-3 text-sm leading-relaxed text-muted">
            AI가 한 번에 한 가지에 집중하도록 <strong className="font-semibold text-charcoal">처음 고른 목적만 첫 프롬프트에 담아요.</strong> 더 고른
            목적은 같은 대화창에 이어서 붙여넣는 짧은 후속 프롬프트로 만들어 드려요.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(ANALYSIS_MODES) as AnalysisMode[]).map((m) => {
              const pos = modeOrder.indexOf(m)
              const on = pos >= 0
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleMode(m)}
                  className={`flex min-h-16 items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${on ? 'border-navy bg-navy/[0.04]' : 'border-line hover:border-navy/40'}`}
                >
                  <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${on ? 'border-navy bg-navy text-ivory' : 'border-line'}`} aria-hidden="true">
                    {on && pos + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 font-semibold">
                      {ANALYSIS_MODES[m].label}
                      {on && (
                        <span className={`text-xs font-medium ${pos === 0 ? 'text-navy' : 'text-sage'}`}>{pos === 0 ? '주 분석' : '이어서 묻기'}</span>
                      )}
                    </span>
                    <span className="block text-sm text-muted">{ANALYSIS_MODES[m].description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset>
            <legend className="field-label">분석 톤</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {(Object.entries(TONES) as [AnalysisSettings['tone'], string][]).map(([k, v]) => (
                <button key={k} type="button" role="radio" aria-checked={settings.tone === k} className="chip" onClick={() => setSettings({ tone: k })}>{v}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="field-label">분석 깊이</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {(Object.entries(DEPTHS) as [AnalysisSettings['depth'], string][]).map(([k, v]) => (
                <button key={k} type="button" role="radio" aria-checked={settings.depth === k} className="chip" onClick={() => setSettings({ depth: k })}>{v}</button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-sage/40 bg-sage-soft/60 p-4 text-sm leading-relaxed" aria-labelledby="privacy-title">
        <h2 id="privacy-title" className="mb-1 flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="size-4 text-sage" aria-hidden="true" /> 붙여넣기 전에 개인정보를 확인해 주세요
        </h2>
        <p className="text-[#46564a]">
          아래 미리보기 전체가 외부 AI 서비스에 공유됩니다. 실명, 연락처, 면접관 이름, 사내 기밀처럼 공유하고 싶지 않은 내용은
          <Link to={`/interview/${iv.id}/questions`} className="mx-1 font-semibold text-navy underline underline-offset-2">기록에서 지우거나</Link>
          'A사', '면접관 1'처럼 바꿔 주세요.
        </p>
        {sensitive.length > 0 && (
          <p className="mt-2 rounded-lg bg-terracotta-soft px-3 py-2 text-[#6e4a3d]" role="alert">
            개인정보로 보이는 내용이 있어요: {sensitive.map((s) => `${s.label} ${s.count}건`).join(', ')}
          </p>
        )}
      </section>

      <section aria-labelledby="preview-title" className="mb-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 id="preview-title" className="text-sm font-semibold">
            {steps.length > 1 ? `1단계 · ${primaryLabel} 프롬프트` : '생성된 프롬프트 미리보기'}
          </h2>
          <span className="text-xs text-muted">{prompt.length.toLocaleString()}자</span>
        </div>
        <div className="relative">
          <textarea
            ref={previewRef}
            readOnly
            value={prompt}
            aria-label="AI에 전달할 프롬프트 전체"
            className={`input block w-full resize-none bg-[#fcfbf9] font-mono text-[13px] leading-relaxed ${expanded ? 'h-[70vh]' : 'h-64'}`}
          />
          {!expanded && <div className="pointer-events-none absolute inset-x-px bottom-px h-16 rounded-b-xl bg-gradient-to-t from-[#fcfbf9]" />}
        </div>
        <button type="button" className="btn-ghost btn mt-1 w-full text-sm" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? '접기' : '전체 펼쳐 보기'}
        </button>
      </section>

      <section className="card space-y-4 p-4 sm:p-6">
        <button type="button" onClick={onCopy} className="btn-primary btn min-h-14 w-full text-base">
          {copyState === 'copied' ? <Check className="size-5" aria-hidden="true" /> : <Copy className="size-5" aria-hidden="true" />}
          {copyState === 'copied' ? '복사했어요' : steps.length > 1 ? '1단계 프롬프트 복사하기' : 'AI 회고 프롬프트 복사하기'}
        </button>
        <p role="status" aria-live="polite" className="text-center text-sm">
          {copyState === 'copied' && <span className="text-sage">클립보드에 복사했어요. 아래에서 AI를 열고 붙여넣어 주세요.</span>}
          {copyState === 'failed' && (
            <span className="text-terracotta">자동 복사가 막혀 있어요. 미리보기 내용을 선택해 두었으니 Ctrl/⌘ + C 또는 길게 눌러 복사해 주세요.</span>
          )}
        </p>
        <div>
          <p className="mb-2 text-center text-xs text-muted">새 탭으로 열려요. 프롬프트는 자동으로 전송되지 않으니 직접 붙여넣어 주세요.</p>
          <div className="grid grid-cols-3 gap-2">
            {AI_LINKS.map((l) => (
              <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className="btn-secondary btn text-sm">
                {l.name} <ExternalLink className="size-3.5 text-muted" aria-hidden="true" />
                <span className="sr-only">(새 탭)</span>
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 border-t border-line pt-4">
          <button type="button" onClick={onDownload} className="btn-ghost btn text-sm">
            <Download className="size-4" aria-hidden="true" /> Markdown 저장
          </button>
          <Link to={`/interview/${iv.id}/questions`} className="btn-ghost btn text-sm">입력 내용 수정하기</Link>
        </div>
      </section>

      {steps.length > 1 && (
        <section className="mt-6 space-y-3" aria-labelledby="followup-title">
          <div>
            <h2 id="followup-title" className="text-lg font-bold">이어서 묻기</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              AI가 앞 단계 답변을 끝까지 마치면, <strong className="font-semibold text-charcoal">같은 대화창에</strong> 순서대로 붙여넣으세요. 면접 기록은 다시 넣지 않아도 돼요.
            </p>
          </div>
          {steps.slice(1).map((st, i) => (
            <FollowUpCard key={st.mode} step={st} index={i + 2} />
          ))}
        </section>
      )}

      <AiReviewSection interviewId={iv.id} content={iv.aiReview.content} savedAt={iv.aiReview.savedAt} />

      <StepFooter>
        <Link to={`/interview/${iv.id}/reflection`} className="btn-ghost btn">
          <ArrowLeft className="size-4" aria-hidden="true" /> 이전
        </Link>
        <Link to="/" className="btn-secondary btn">처음으로</Link>
      </StepFooter>
    </AppShell>
  )
}

function FollowUpCard({ step, index }: { step: PromptStep; index: number }) {
  const [state, setState] = useState<CopyState>('idle')
  const ref = useRef<HTMLTextAreaElement>(null)
  const label = ANALYSIS_MODES[step.mode].label
  const onCopy = async () => {
    const ok = await copyText(step.text)
    setState(ok ? 'copied' : 'failed')
    if (!ok) requestAnimationFrame(() => ref.current?.select())
  }
  return (
    <article className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">
          <span className="mr-1.5 text-sm font-bold text-sage">{index}단계</span>
          {label}
        </h3>
        <button type="button" onClick={onCopy} className="btn-secondary btn min-h-10 shrink-0 text-sm">
          {state === 'copied' ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {state === 'copied' ? '복사했어요' : `${index}단계 복사`}
        </button>
      </div>
      <textarea
        ref={ref}
        readOnly
        value={step.text}
        aria-label={`${index}단계 ${label} 후속 프롬프트`}
        className="input block h-36 w-full resize-y bg-[#fcfbf9] font-mono text-[13px] leading-relaxed"
      />
      <p role="status" aria-live="polite" className="mt-2 text-sm">
        {state === 'copied' && <span className="text-sage">복사했어요. 앞 답변이 끝난 대화창에 붙여넣어 주세요.</span>}
        {state === 'failed' && <span className="text-terracotta">자동 복사가 막혀 있어요. 선택된 내용을 직접 복사해 주세요.</span>}
      </p>
    </article>
  )
}

function AiReviewSection({ interviewId, content, savedAt }: { interviewId: string; content: string; savedAt: string | null }) {
  const { update } = useInterviewStore()
  const [open, setOpen] = useState(Boolean(content))
  const setContent = (v: string) => update(interviewId, (p) => ({ ...p, aiReview: { ...p.aiReview, content: v } }))
  const save = () => update(interviewId, (p) => ({ ...p, aiReview: { content: p.aiReview.content, savedAt: new Date().toISOString() } }))
  const savedLabel = savedAt ? new Date(savedAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }) : null

  return (
    <section className="card mt-6 p-4 sm:p-6" aria-labelledby="review-title">
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>
          <span id="review-title" className="flex items-center gap-1.5 text-lg font-bold">
            <Sparkles className="size-4 text-sage" aria-hidden="true" /> AI 회고 결과 보관하기
          </span>
          <span className="mt-0.5 block text-sm text-muted">
            {savedLabel ? `${savedLabel}에 저장한 회고가 있어요` : 'AI에게 받은 답변을 붙여넣어 이 면접 기록과 함께 보관해요'}
          </span>
        </span>
        <span className="text-sm text-navy">{open ? '닫기' : '열기'}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <label htmlFor="ai-review" className="sr-only">AI 회고 결과</label>
          <AutoTextarea id="ai-review" value={content} onValueChange={setContent} minRows={6} placeholder="AI가 작성한 회고 결과를 여기에 붙여넣으세요" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">입력하는 내용은 자동으로 임시 저장돼요.</p>
            <button type="button" className="btn-primary btn" onClick={save} disabled={!content.trim()}>
              회고 결과 저장
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
