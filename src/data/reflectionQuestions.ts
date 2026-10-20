import type { Interview, ReflectionKey } from '../types/interview'

export type ReflectionQuestion = {
  key: ReflectionKey | 'joinIntention'
  label: string
  placeholder?: string
  /** 기본 회고(핵심 질문)에 포함되는지 */
  core: boolean | ((iv: Interview) => boolean)
  /** 이미 기록한 내용과 겹치면 숨긴다 */
  skipIf?: (iv: Interview) => boolean
  /** 앞 단계에서 비슷한 내용을 적었다면 보여줄 안내 */
  hint?: (iv: Interview) => string | null
  chips?: string[]
}

export type ReflectionCategory = { id: string; title: string; description: string; questions: ReflectionQuestion[] }

const reactionsRecorded = (iv: Interview) =>
  iv.questions.filter((q) => q.reaction.trim() && q.reaction.trim() !== '기억나지 않음').length

export const REFLECTION_CATEGORIES: ReflectionCategory[] = [
  {
    id: 'experience',
    title: '면접 경험',
    description: '면접 전체를 한 발 떨어져서 떠올려 봐요.',
    questions: [
      {
        key: 'overallFeeling',
        label: '면접을 마친 직후의 기분은 어땠나요?',
        core: true,
        chips: ['후련했다', '무난했다', '아쉬움이 컸다', '잘 모르겠다'],
      },
      { key: 'confidentMoment', label: '어떤 질문에서 가장 자신 있었나요?', core: false },
      { key: 'flusteredMoment', label: '어떤 질문에서 당황했나요?', core: false },
      {
        key: 'notableReaction',
        label: '면접관이 특별한 반응을 보인 순간이 있었나요?',
        core: false,
        // 질문 카드마다 반응을 대부분 적었다면 다시 묻지 않는다
        skipIf: (iv) => iv.questions.length > 0 && reactionsRecorded(iv) >= Math.ceil(iv.questions.length * 0.6),
      },
    ],
  },
  {
    id: 'self',
    title: '자기 평가',
    description: '잘한 점과 아쉬운 점을 나눠서 적어 보세요.',
    questions: [
      { key: 'strengths', label: '이번 면접에서 가장 잘했다고 생각하는 점은?', core: true },
      {
        key: 'improvements',
        label: '다시 답변한다면 바꾸고 싶은 부분이 있나요?',
        core: true,
        hint: (iv) => {
          const n = iv.questions.filter((q) => q.regret.trim()).length
          return n ? `질문별 아쉬운 점을 ${n}개 적어 두었어요. 여기에는 면접 전체에 대한 생각만 적어도 충분해요.` : null
        },
      },
      { key: 'strengthShown', label: '나의 강점을 충분히 보여줬다고 생각하나요?', core: false },
    ],
  },
  {
    id: 'fit',
    title: '조직 적합성',
    description: '나도 회사를 평가하는 입장이에요. 느낀 그대로 적어 주세요.',
    questions: [
      { key: 'companyExpectation', label: '면접 전 회사에 대해 기대했던 점은?', core: false },
      { key: 'changedView', label: '면접을 진행하면서 생각이 바뀐 부분이 있었나요?', core: false },
      { key: 'joinIntention', label: '합격한다면 입사하고 싶은 마음이 있나요?', core: true },
      {
        key: 'companyConcern',
        label: '업무 범위나 처우와 관련해 우려되는 부분이 있었나요?',
        placeholder: '들은 내용과 내 추측을 구분해서 적으면 더 정확한 분석을 받을 수 있어요',
        // 입사 의향이 확실하지 않으면 기본 회고에서도 묻는다
        core: (iv) => iv.reflection.joinIntention === 'unsure' || iv.reflection.joinIntention === 'no',
      },
    ],
  },
  {
    id: 'wrapup',
    title: '마무리',
    description: 'AI에게 무엇을 물어볼지 정해요.',
    questions: [
      { key: 'applyNext', label: '다음 면접에 꼭 적용하고 싶은 경험은?', core: false },
      {
        key: 'focusRequest',
        label: 'AI에게 가장 자세히 분석받고 싶은 부분은?',
        placeholder: '예: 지원동기 답변이 설득력 있었는지, 경력 공백 설명이 괜찮았는지',
        core: true,
      },
      { key: 'additionalNotes', label: '그 밖에 남기고 싶은 메모', core: false },
    ],
  },
]

export function visibleQuestions(cat: ReflectionCategory, iv: Interview): ReflectionQuestion[] {
  return cat.questions.filter((q) => {
    if (q.skipIf?.(iv)) return false
    if (iv.deepReflection) return true
    const core = typeof q.core === 'function' ? q.core(iv) : q.core
    // 기본 모드라도 이미 답한 질문은 계속 보여준다
    const answered = q.key === 'joinIntention' ? iv.reflection.joinIntention !== '' : iv.reflection[q.key].trim() !== ''
    return core || answered
  })
}
