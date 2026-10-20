import {
  ANALYSIS_MODES,
  DEPTHS,
  FORMATS,
  JOIN_INTENTIONS,
  STAGES,
  TONES,
  type AnalysisMode,
  type Interview,
  type Question,
  type ReflectionKey,
} from '../types/interview'

export const NOT_RECORDED = '미기록'

const clean = (s: string | null | undefined) => (s ?? '').replace(/\r\n?/g, '\n').trim()

/** 여러 줄 값은 목록 들여쓰기를 유지해 붙인다. */
function line(label: string, value: string | null | undefined, { omitEmpty = false } = {}): string | null {
  const v = clean(value)
  if (!v) return omitEmpty ? null : `- ${label}: ${NOT_RECORDED}`
  if (!v.includes('\n')) return `- ${label}: ${v}`
  return `- ${label}:\n${v.split('\n').map((l) => `  ${l}`.trimEnd()).join('\n')}`
}

const join = (parts: (string | null | false | undefined)[]) => parts.filter((p): p is string => Boolean(p)).join('\n')

const MODE_GOALS: Record<AnalysisMode, string> = {
  overall: '질문별 답변을 평가하고 면접 전체의 흐름을 분석해 주세요.',
  answers: '각 질문의 의도와 답변의 논리성·설득력을 집중적으로 분석하고 개선 방향을 제시해 주세요.',
  fit: '면접에서 확인된 조직의 특성과 지원자의 기대·우려를 비교하고, 입사 결정 전 확인할 사항을 정리해 주세요.',
  nextPrep: '이번 경험을 바탕으로 다음 면접을 위한 구체적인 개선점, 답변 구조, 학습 과제를 만들어 주세요.',
}

const TONE_GUIDE: Record<keyof typeof TONES, string> = {
  balanced: '강점과 보완점을 균형 있게 다뤄 주세요.',
  critical: '실제 면접관의 기준으로 엄격하게 평가하고, 약점을 우선해서 근거와 함께 지적해 주세요.',
  encouraging: '잘한 점을 먼저 짚되, 보완점을 축소하지 말고 실행 가능한 형태로 제안해 주세요.',
}

const DEPTH_GUIDE: Record<keyof typeof DEPTHS, string> = {
  brief: '각 항목을 핵심만 2~3문장으로 간결하게 작성해 주세요.',
  normal: '각 항목을 핵심 근거와 함께 적당한 분량으로 작성해 주세요.',
  detailed: '질문 하나하나를 자세히 분석하고, 필요한 곳에는 개선된 답변 예시를 포함해 주세요.',
}

type ResultItem = { id: string; text: string; supersededBy?: AnalysisMode }

const RESULT_ITEMS: Record<AnalysisMode, ResultItem[]> = {
  overall: [
    { id: 'summary', text: '전체 면접의 핵심 요약' },
    { id: 'perQuestion', text: '질문별 의도 및 답변 분석', supersededBy: 'answers' },
    { id: 'best', text: '가장 잘한 답변 3개와 그 이유 (기록된 질문이 3개 미만이면 기록된 범위 안에서)' },
    { id: 'worst', text: '가장 아쉬운 답변 3개와 개선안', supersededBy: 'answers' },
    { id: 'strengths', text: '면접 전반에 드러난 핵심 강점' },
    { id: 'gaps', text: '보완이 필요한 역량' },
    { id: 'fitBrief', text: '조직 적합성에 대한 관찰과 추가 확인 사항', supersededBy: 'fit' },
    { id: 'plan', text: '다음 면접을 위한 구체적인 행동 계획', supersededBy: 'nextPrep' },
    { id: 'closing', text: '종합 회고' },
  ],
  answers: [
    { id: 'intent', text: '질문별 면접관의 예상 의도 (가능성으로 설명)' },
    { id: 'logic', text: '질문별 답변의 논리 구조, 설득력, 근거의 구체성 평가' },
    { id: 'rewrite', text: '아쉬운 답변별 개선 답변 예시 (실제 발언의 의미를 유지)' },
    { id: 'pattern', text: '여러 답변에 반복해서 나타나는 습관이나 패턴' },
  ],
  fit: [
    { id: 'orgTraits', text: '면접에서 드러난 조직의 특성 (확인된 사실과 추정을 구분)' },
    { id: 'expectGap', text: '면접 전 기대와 면접 후 인상의 차이' },
    { id: 'concerns', text: '우려 사항별로 사실 여부를 확인할 수 있는 구체적인 질문' },
    { id: 'decision', text: '입사 결정 전에 점검할 체크리스트' },
  ],
  nextPrep: [
    { id: 'top3', text: '다음 면접 전에 가장 먼저 개선할 3가지' },
    { id: 'structure', text: '이번에 받은 질문을 바탕으로 한 답변 구조 (모범 답변 예시 포함)' },
    { id: 'followUps', text: '이어질 수 있는 꼬리 질문과 준비 방향' },
    { id: 'study', text: '보완을 위한 학습 과제와 1주일 준비 계획' },
  ],
}

const MODE_ORDER: AnalysisMode[] = ['overall', 'answers', 'fit', 'nextPrep']

export function resultItems(modes: AnalysisMode[]): string[] {
  const selected = MODE_ORDER.filter((m) => modes.includes(m))
  const list = selected.length ? selected : (['overall'] as AnalysisMode[])
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of list) {
    for (const item of RESULT_ITEMS[m]) {
      if (item.supersededBy && list.includes(item.supersededBy)) continue
      if (seen.has(item.id)) continue
      seen.add(item.id)
      out.push(item.text)
    }
  }
  // 종합 회고는 항상 마지막에 둔다
  const closing = RESULT_ITEMS.overall.at(-1)!.text
  if (out.includes(closing)) out.push(...out.splice(out.indexOf(closing), 1))
  return out
}

const PRINCIPLES = [
  '무조건 긍정적으로 평가하지 마세요.',
  '답변의 강점과 부족한 부분을 구분하세요.',
  '면접관의 의도는 단정하지 말고 가능성으로 설명하세요.',
  '표정이나 반응만으로 합격 여부를 판단하지 마세요.',
  '입력되지 않은 사실을 만들어내지 마세요. "미기록" 항목은 추측으로 채우지 마세요.',
  '지원자의 관찰과 추측을 구분하세요.',
  '조직에 대한 우려는 사실 여부를 확인할 수 있는 구체적인 질문으로 전환하세요.',
  '근거 없는 합격 확률이나 점수를 제시하지 마세요.',
  '답변 개선안은 실제 발언의 의미를 유지하세요.',
  '분석에 필요한 정보가 부족하면 그 한계를 명시하세요.',
]

/** 질문 카드에 실제로 쓴 내용이 있는 카드만 남긴다 */
export const recordedQuestions = (iv: Interview) =>
  iv.questions.filter((q) => [q.question, q.answer, q.reaction, q.feeling, q.regret, q.memo].some((v) => clean(v)))

function questionBlock(q: Question, n: number): string {
  const title = clean(q.question) ? clean(q.question).replace(/\n+/g, ' ') : '(질문 내용 미기록)'
  return join([
    `### Q${n}. ${title}`,
    line('지원자의 실제 답변', q.answer),
    line('면접관의 반응 (지원자의 관찰)', q.reaction),
    line('당시 감정', q.feeling),
    line('본인이 생각하는 아쉬운 점', q.regret),
    line('추가 메모', q.memo, { omitEmpty: true }),
  ])
}

const REFLECTION_LABELS: [ReflectionKey, string][] = [
  ['overallFeeling', '면접 직후의 기분'],
  ['confidentMoment', '가장 자신 있었던 질문'],
  ['flusteredMoment', '당황했던 질문'],
  ['notableReaction', '면접관이 특별한 반응을 보인 순간'],
  ['strengths', '스스로 가장 잘했다고 생각하는 점'],
  ['improvements', '다시 답변한다면 바꾸고 싶은 부분'],
  ['strengthShown', '강점을 충분히 보여줬는지에 대한 생각'],
  ['applyNext', '다음 면접에 적용하고 싶은 경험'],
  ['additionalNotes', '기타 메모'],
]

const FIT_LABELS: [ReflectionKey, string][] = [
  ['companyExpectation', '면접 전 회사에 대한 기대'],
  ['changedView', '면접 중 바뀐 생각'],
  ['companyConcern', '업무 범위·처우 관련 우려'],
]

export type RecordAssessment = { questionCount: number; answeredCount: number; reflectionCount: number; warnings: string[] }

export function assessRecord(iv: Interview): RecordAssessment {
  const qs = recordedQuestions(iv)
  const answeredCount = qs.filter((q) => clean(q.answer)).length
  const reflectionCount =
    [...REFLECTION_LABELS, ...FIT_LABELS].filter(([k]) => clean(iv.reflection[k])).length + (iv.reflection.joinIntention ? 1 : 0)
  const warnings: string[] = []
  if (qs.length === 0) warnings.push('기록된 면접 질문이 없습니다.')
  else if (qs.length < 3) warnings.push(`기록된 질문이 ${qs.length}개뿐이라 면접 전체를 대표하지 못할 수 있습니다.`)
  if (qs.length > 0 && answeredCount < Math.ceil(qs.length / 2))
    warnings.push(`질문 ${qs.length}개 중 ${answeredCount}개에만 답변 내용이 기록되어 있습니다.`)
  return { questionCount: qs.length, answeredCount, reflectionCount, warnings }
}

const formatDate = (d: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : d
}

export function buildPrompt(iv: Interview): string {
  const { modes, tone, depth } = iv.analysisSettings
  const activeModes = MODE_ORDER.filter((m) => modes.includes(m))
  const modeList = activeModes.length ? activeModes : (['overall'] as AnalysisMode[])
  const qs = recordedQuestions(iv)
  const r = iv.reflection
  const atmosphere = [iv.atmosphereTags.join(', '), clean(iv.atmosphere)].filter(Boolean).join(' / ')
  const { warnings } = assessRecord(iv)

  const reflectionLines = REFLECTION_LABELS.map(([k, label]) => line(label, r[k], { omitEmpty: true }))
  const fitLines = [
    ...FIT_LABELS.map(([k, label]) => line(label, r[k], { omitEmpty: true })),
    r.joinIntention ? line('합격 시 입사 의향', JOIN_INTENTIONS[r.joinIntention]) : null,
  ]
  const hasReflection = reflectionLines.some(Boolean)
  const hasFit = fitLines.some(Boolean)

  const sections = [
    join([
      '당신은 경력 개발, 면접 분석, 직무 적합성 평가를 지원하는 전문 커리어 컨설턴트입니다.',
      '',
      '아래 내용은 지원자가 실제 면접이 끝난 뒤 기억을 바탕으로 정리한 회고 기록입니다. 면접 녹취록이 아니며, 실제 면접 평가 결과나 합격 여부는 알려지지 않았습니다.',
      '',
      '이 기록을 객관적이고 비판적인 관점에서 분석해 주세요.',
    ]),
    join([
      '## 분석 목표',
      ...modeList.map((m) => `- **${ANALYSIS_MODES[m].label}**: ${MODE_GOALS[m]}`),
      clean(r.focusRequest) ? line('지원자가 특히 자세히 알고 싶은 점', r.focusRequest) : null,
    ]),
    join(['## 분석 방식', `- 톤 (${TONES[tone]}): ${TONE_GUIDE[tone]}`, `- 깊이 (${DEPTHS[depth]}): ${DEPTH_GUIDE[depth]}`, '- 톤과 관계없이 기록에 근거해 평가해 주세요.']),
    join([
      '## 면접 기본 정보',
      line('회사·기관명', iv.company),
      line('지원 직무', iv.position),
      line('면접 날짜', iv.date ? formatDate(iv.date) : ''),
      line('면접 단계', iv.stage ? STAGES[iv.stage] : ''),
      line('면접 방식', iv.format ? FORMATS[iv.format] : ''),
      line('면접관 수', iv.interviewerCount ? `${iv.interviewerCount}명` : ''),
      line('진행 시간', iv.durationMinutes ? `약 ${iv.durationMinutes}분` : ''),
      line('면접 분위기', atmosphere),
    ]),
    join([
      '## 실제 면접 질문 및 답변',
      `지원자가 기억에 의존해 기록한 질문 ${qs.length}개입니다. 질문 순서는 지원자가 기록한 순서이며, "${NOT_RECORDED}"은 지원자가 기억하지 못했거나 적지 않은 항목입니다.`,
      '',
      qs.length ? qs.map((q, i) => questionBlock(q, i + 1)).join('\n\n') : `(기록된 질문 없음)`,
    ]),
    join(['## 면접 전체 회고 (지원자의 자기 평가와 감정)', ...(hasReflection ? reflectionLines : [`- ${NOT_RECORDED}`])]),
    join(['## 조직 적합성 관련 관찰 (지원자의 인상)', ...(hasFit ? fitLines : [`- ${NOT_RECORDED}`])]),
    warnings.length
      ? join(['## 기록의 한계', ...warnings.map((w) => `- ${w}`), '- 이 한계를 고려해 단정적인 평가를 피하고, 추가로 확인하면 좋을 정보를 알려 주세요.'])
      : null,
    join(['## 분석 원칙', ...PRINCIPLES.map((p, i) => `${i + 1}. ${p}`)]),
    join(['## 원하는 결과', ...resultItems(modeList).map((t, i) => `${i + 1}. ${t}`)]),
    join([
      '최종 분석은 자연스러운 한국어로 작성하세요.',
      '지원자를 일방적으로 위로하지 말고, 확인 가능한 근거를 중심으로 실질적인 조언을 제공하세요.',
    ]),
  ]
  return sections.filter(Boolean).join('\n\n') + '\n'
}

/** 프롬프트에서 개인정보로 보이는 패턴을 찾는다 */
export function detectSensitive(text: string): { label: string; count: number }[] {
  const rules: [string, RegExp][] = [
    ['휴대전화 번호', /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/g],
    ['이메일 주소', /[\w.+-]+@[\w-]+\.[\w.-]+/g],
    ['주민등록번호', /\b\d{6}[-\s]?[1-4]\d{6}\b/g],
  ]
  return rules.map(([label, re]) => ({ label, count: (text.match(re) ?? []).length })).filter((r) => r.count > 0)
}

export function promptFileName(iv: Interview) {
  const safe = (s: string) => s.trim().replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30)
  return ['AFTERVIEW', safe(iv.company) || '면접', iv.date || new Date().toLocaleDateString('sv-SE')].join('_') + '.md'
}
