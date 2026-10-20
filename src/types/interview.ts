import { z } from 'zod'

export const SCHEMA_VERSION = 1

export const STAGES = {
  first: '1차 면접',
  second: '2차 면접',
  final: '최종 면접',
  practical: '실무 면접',
  executive: '임원 면접',
  other: '기타',
} as const

export const FORMATS = {
  inPerson: '대면',
  video: '화상',
  phone: '전화',
  other: '기타',
} as const

export const JOIN_INTENTIONS = {
  yes: '입사하고 싶다',
  unsure: '아직 잘 모르겠다',
  no: '입사하고 싶지 않다',
} as const

export const ANALYSIS_MODES = {
  overall: { label: '종합 회고', description: '질문별 답변 평가와 전체 면접 흐름 분석' },
  answers: { label: '답변 집중 분석', description: '질문 의도, 논리성, 설득력, 개선 방향' },
  fit: { label: '조직 적합성 분석', description: '조직 특성, 나의 기대와 우려, 추가 확인 사항' },
  nextPrep: { label: '다음 면접 준비', description: '개선점, 모범 답변, 학습 과제' },
} as const

export const TONES = { balanced: '균형 잡힌', critical: '비판적인', encouraging: '격려 중심' } as const
export const DEPTHS = { brief: '간단히', normal: '보통', detailed: '상세히' } as const

type Keys<T> = [keyof T & string, ...(keyof T & string)[]]
const keysOf = <T extends object>(o: T) => Object.keys(o) as Keys<T>

const text = z.string().catch('')

export const questionSchema = z.object({
  id: z.string(),
  order: z.number().catch(0),
  question: text,
  answer: text,
  reaction: text,
  feeling: text,
  regret: text,
  memo: text,
})

export const reflectionSchema = z.object({
  overallFeeling: text,
  confidentMoment: text,
  flusteredMoment: text,
  notableReaction: text,
  strengths: text,
  improvements: text,
  strengthShown: text,
  companyExpectation: text,
  changedView: text,
  companyConcern: text,
  joinIntention: z.enum(keysOf(JOIN_INTENTIONS)).or(z.literal('')).catch(''),
  applyNext: text,
  focusRequest: text,
  additionalNotes: text,
})

export const analysisSettingsSchema = z.object({
  modes: z.array(z.enum(keysOf(ANALYSIS_MODES))).min(1).catch(['overall']),
  tone: z.enum(keysOf(TONES)).catch('balanced'),
  depth: z.enum(keysOf(DEPTHS)).catch('normal'),
})

export const interviewSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.number().catch(SCHEMA_VERSION),
  company: text,
  position: text,
  date: text,
  stage: z.enum(keysOf(STAGES)).or(z.literal('')).catch(''),
  interviewerCount: z.number().int().positive().nullable().catch(null),
  durationMinutes: z.number().int().positive().nullable().catch(null),
  format: z.enum(keysOf(FORMATS)).or(z.literal('')).catch(''),
  atmosphereTags: z.array(z.string()).catch([]),
  atmosphere: text,
  status: z.enum(['draft', 'completed']).catch('draft'),
  deepReflection: z.boolean().catch(false),
  questions: z.array(questionSchema).catch([]),
  reflection: reflectionSchema.catch(() => reflectionSchema.parse({})),
  analysisSettings: analysisSettingsSchema.catch({ modes: ['overall'], tone: 'balanced', depth: 'normal' }),
  aiReview: z
    .object({ content: text, savedAt: z.string().nullable().catch(null) })
    .catch({ content: '', savedAt: null }),
  createdAt: z.string().catch(() => new Date().toISOString()),
  updatedAt: z.string().catch(() => new Date().toISOString()),
})

export type Question = z.infer<typeof questionSchema>
export type Reflection = z.infer<typeof reflectionSchema>
export type AnalysisSettings = z.infer<typeof analysisSettingsSchema>
export type Interview = z.infer<typeof interviewSchema>
export type AnalysisMode = AnalysisSettings['modes'][number]
export type ReflectionKey = Exclude<keyof Reflection, 'joinIntention'>

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export function createQuestion(order = 1): Question {
  return { id: uid('q'), order, question: '', answer: '', reaction: '', feeling: '', regret: '', memo: '' }
}

export function createInterview(): Interview {
  const now = new Date().toISOString()
  return interviewSchema.parse({
    id: uid('interview'),
    schemaVersion: SCHEMA_VERSION,
    questions: [createQuestion(1)],
    reflection: {},
    createdAt: now,
    updatedAt: now,
  })
}

/** 질문 카드에 실제로 적힌 내용이 있는지 */
export const questionHasContent = (q: Question) =>
  [q.question, q.answer, q.reaction, q.feeling, q.regret, q.memo].some((v) => v.trim() !== '')
