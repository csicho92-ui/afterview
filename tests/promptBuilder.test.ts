import { describe, expect, it } from 'vitest'
import { assessRecord, buildMarkdownExport, buildPrompt, buildPromptSteps, detectSensitive, NOT_RECORDED, resultItems } from '../src/lib/promptBuilder'
import { parseInterviews } from '../src/lib/storage'
import { createInterview, createQuestion, type Interview } from '../src/types/interview'

function sample(): Interview {
  const iv = createInterview()
  return {
    ...iv,
    company: '예시 기관',
    position: '웹 콘텐츠 담당',
    date: '2026-10-19',
    stage: 'first',
    interviewerCount: 3,
    durationMinutes: 25,
    atmosphereTags: ['차분한'],
    questions: [
      { ...createQuestion(1), question: '자기소개를 해 주세요.', answer: '경력 위주로 1분 동안 소개했다.\n마지막에 지원 동기를 덧붙였다.', reaction: '고개를 끄덕였다' },
      { ...createQuestion(2), question: '홈페이지에서 개선할 점은?', answer: '공지사항이 이미지라 번역이 어렵다고 말했다.', feeling: '자신 있었다', regret: '근거 데이터가 부족했다' },
      { ...createQuestion(3) }, // 빈 카드는 제외되어야 한다
    ],
    reflection: { ...iv.reflection, overallFeeling: '무난했다', joinIntention: 'unsure', companyConcern: '야근이 잦다고 들었다' },
  }
}

describe('buildPrompt', () => {
  it('입력한 질문과 답변을 순서대로 번호를 붙여 넣는다', () => {
    const p = buildPrompt(sample())
    expect(p).toContain('### Q1. 자기소개를 해 주세요.')
    expect(p).toContain('### Q2. 홈페이지에서 개선할 점은?')
    expect(p).not.toContain('### Q3.')
    expect(p.indexOf('Q1.')).toBeLessThan(p.indexOf('Q2.'))
    expect(p).toContain('  마지막에 지원 동기를 덧붙였다.') // 여러 줄 답변 들여쓰기
  })

  it('비어 있는 항목은 지어내지 않고 미기록으로 표시한다', () => {
    const p = buildPrompt(sample())
    const q1 = p.slice(p.indexOf('### Q1.'), p.indexOf('### Q2.'))
    expect(q1).toContain(`당시 감정: ${NOT_RECORDED}`)
    expect(q1).not.toContain('추가 메모') // 선택 메모는 생략
    expect(p).toContain(`면접 방식: ${NOT_RECORDED}`)
  })

  it('기본 정보, 회고, 조직 적합성을 반영한다', () => {
    const p = buildPrompt(sample())
    expect(p).toContain('회사·기관명: 예시 기관')
    expect(p).toContain('면접 날짜: 2026년 10월 19일')
    expect(p).toContain('면접 단계: 1차 면접')
    expect(p).toContain('면접관 수: 3명')
    expect(p).toContain('면접 직후의 기분: 무난했다')
    expect(p).toContain('합격 시 입사 의향: 아직 잘 모르겠다')
    expect(p).toContain('업무 범위·처우 관련 우려: 야근이 잦다고 들었다')
  })

  it('질문이 적으면 기록의 한계를 명시한다', () => {
    const p = buildPrompt(sample())
    expect(p).toContain('## 기록의 한계')
    expect(assessRecord(sample()).questionCount).toBe(2)
  })

  it('종합 회고는 6개 항목으로 요청한다', () => {
    const p = buildPrompt(sample())
    expect(resultItems('overall')).toHaveLength(6)
    expect(p).toContain('6. 다음 면접을 위한 구체적인 행동 계획과 종합 회고')
    const results = p.slice(p.indexOf('## 원하는 결과'))
    expect(results).not.toContain('7. ')
    expect(p).toContain('"계속"이라고 입력하면') // 길어질 때 이어 쓰기 지시
  })

  it('여러 목적을 고르면 첫 번째만 주 프롬프트에 담고 나머지는 후속 프롬프트로 나눈다', () => {
    const iv = { ...sample(), analysisSettings: { modes: ['fit', 'overall', 'nextPrep'] as const, tone: 'critical' as const, depth: 'normal' as const } }
    const steps = buildPromptSteps({ ...iv, analysisSettings: { ...iv.analysisSettings, modes: [...iv.analysisSettings.modes] } })
    expect(steps.map((s) => s.mode)).toEqual(['fit', 'overall', 'nextPrep'])
    const [main, second, third] = steps.map((s) => s.text)
    expect(main).toContain('**조직 적합성 분석**')
    expect(main).toContain('입사 결정 전에 점검할 체크리스트')
    expect(main).not.toContain('1주일 준비 계획')
    expect(main).toContain('이 목표에만 집중')
    // 후속 프롬프트는 기록을 다시 담지 않는다
    expect(second).toContain('**종합 회고** 관점')
    expect(second).not.toContain('자기소개를 해 주세요.')
    expect(second).toContain('톤: 비판적인')
    expect(third).toContain('1주일 준비 계획')
  })

  it('목적이 하나면 단계도 하나이고 Markdown은 프롬프트 그대로다', () => {
    const iv = sample()
    expect(buildPromptSteps(iv)).toHaveLength(1)
    expect(buildPrompt(iv)).not.toContain('이 목표에만 집중')
    expect(buildMarkdownExport(iv)).toBe(buildPrompt(iv))
    const multi = { ...iv, analysisSettings: { ...iv.analysisSettings, modes: ['overall' as const, 'answers' as const] } }
    expect(buildMarkdownExport(multi)).toContain('2단계: 답변 집중 분석')
  })

  it('수정한 내용으로 다시 생성된다', () => {
    const iv = sample()
    const edited = { ...iv, questions: iv.questions.map((q, i) => (i === 0 ? { ...q, answer: '수정한 답변' } : q)) }
    expect(buildPrompt(edited)).toContain('지원자의 실제 답변: 수정한 답변')
  })

  it('질문 10개 이상도 모두 포함한다', () => {
    const iv = sample()
    iv.questions = Array.from({ length: 12 }, (_, i) => ({ ...createQuestion(i + 1), question: `질문 ${i + 1}`, answer: '답변' }))
    const p = buildPrompt(iv)
    expect(p).toContain('### Q12. 질문 12')
    expect(p).not.toContain('## 기록의 한계')
  })
})

describe('detectSensitive', () => {
  it('연락처와 이메일을 찾는다', () => {
    const found = detectSensitive('연락처 010-1234-5678, mail me@example.com')
    expect(found.map((f) => f.label)).toEqual(['휴대전화 번호', '이메일 주소'])
  })
})

describe('storage', () => {
  it('백업 형식을 검증하고 깨진 항목은 건너뛴다', () => {
    const good = sample()
    const { interviews, skipped } = parseInterviews({ app: 'afterview', schemaVersion: 1, interviews: [good, { nope: true }] })
    expect(interviews).toHaveLength(1)
    expect(skipped).toBe(1)
    expect(interviews[0].questions[0].question).toBe('자기소개를 해 주세요.')
  })

  it('누락된 필드는 기본값으로 채운다', () => {
    const { interviews } = parseInterviews([{ id: 'old', company: 'A사', questions: [{ id: 'q1', question: '질문' }] }])
    expect(interviews[0].analysisSettings.modes).toEqual(['overall'])
    expect(interviews[0].questions[0].answer).toBe('')
  })

  it('형식이 아니면 오류를 낸다', () => {
    expect(() => parseInterviews('hello')).toThrow()
  })
})
