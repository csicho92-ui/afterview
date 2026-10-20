// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { STORAGE_KEY } from '../src/lib/storage'

const flushSave = () => act(() => vi.advanceTimersByTimeAsync(500))

describe('핵심 사용자 흐름', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    localStorage.clear()
    window.location.hash = '#/'
    window.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('기록 생성 → 질문 기록 → 새로고침 복원 → 프롬프트 생성·복사', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    render(<App />)

    // AC-01: 필수 정보 없이 진행하면 오류
    await user.click(screen.getByRole('button', { name: /새 면접 기록하기/ }))
    await user.click(screen.getByRole('button', { name: /질문 기록하기/ }))
    expect(screen.getByText('회사·기관명을 입력해 주세요.')).toBeTruthy()

    await user.type(screen.getByLabelText(/회사·기관명/), '예시 기관')
    await user.type(screen.getByLabelText(/지원 직무/), '웹 콘텐츠 담당')
    await user.click(screen.getByRole('button', { name: /질문 기록하기/ }))
    expect(screen.getByRole('heading', { name: '면접에서 어떤 질문을 받았나요?' })).toBeTruthy()

    // AC-02: 질문 입력 후 추가해도 기존 값 유지
    await user.type(screen.getByLabelText('면접관이 어떤 질문을 했나요?'), '자기소개를 해 주세요.')
    await user.type(screen.getByLabelText('어떻게 답변했나요?'), '경력 위주로 소개했다.')
    await user.click(screen.getByRole('button', { name: '+ 고개를 끄덕였다' }))
    await user.click(screen.getByRole('button', { name: /질문 추가하기/ }))
    const questionInputs = screen.getAllByLabelText('면접관이 어떤 질문을 했나요?')
    expect(questionInputs).toHaveLength(1) // 새 카드만 펼쳐짐
    expect(screen.getByText('자기소개를 해 주세요.')).toBeTruthy() // 접힌 카드 제목으로 유지
    await user.type(questionInputs[0], '홈페이지 개선점은?')
    await flushSave()

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(saved.interviews[0].questions).toHaveLength(2)
    expect(saved.interviews[0].questions[0].reaction).toBe('고개를 끄덕였다')

    // AC-03: 새로고침(재마운트) 후 복원
    cleanup()
    render(<App />)
    expect(screen.getByText('자기소개를 해 주세요.')).toBeTruthy()
    expect((screen.getByLabelText('면접관이 어떤 질문을 했나요?') as HTMLTextAreaElement).value).toBe('홈페이지 개선점은?')

    // 회고 → 프롬프트
    await user.click(screen.getByRole('button', { name: /다음 단계/ }))
    expect(screen.getByRole('heading', { name: '조금만 더 돌아볼까요?' })).toBeTruthy()
    await user.type(screen.getByLabelText('면접을 마친 직후의 기분은 어땠나요?'), '무난했다')
    await user.click(screen.getByRole('button', { name: /건너뛰고 프롬프트 만들기/ }))

    // AC-04, AC-07: 프롬프트에 입력값 반영 + 개인정보 안내
    const preview = screen.getByLabelText('AI에 전달할 프롬프트 전체') as HTMLTextAreaElement
    expect(preview.value).toContain('### Q1. 자기소개를 해 주세요.')
    expect(preview.value).toContain('### Q2. 홈페이지 개선점은?')
    expect(preview.value).toContain('면접 직후의 기분: 무난했다')
    expect(screen.getByText(/붙여넣기 전에 개인정보를 확인해 주세요/)).toBeTruthy()

    // 분석 모드 변경 시 결과 항목이 바뀐다
    await user.click(screen.getByRole('button', { name: /조직 적합성 분석/ }))
    expect(preview.value).toContain('입사 결정 전에 점검할 체크리스트')

    // AC-05: 복사
    await user.click(screen.getByRole('button', { name: /AI 회고 프롬프트 복사하기/ }))
    expect(writeText).toHaveBeenCalledWith(preview.value)
    expect(screen.getByText(/클립보드에 복사했어요/)).toBeTruthy()

    // AC-08: AI 회고 결과 저장
    await user.click(screen.getByRole('button', { name: /AI 회고 결과 보관하기/ }))
    await user.type(screen.getByLabelText('AI 회고 결과'), '좋은 분석 결과')
    await user.click(screen.getByRole('button', { name: '회고 결과 저장' }))
    await flushSave()
    const after = JSON.parse(localStorage.getItem(STORAGE_KEY)!).interviews[0]
    expect(after.aiReview.content).toBe('좋은 분석 결과')
    expect(after.aiReview.savedAt).toBeTruthy()
    expect(after.status).toBe('completed')
  })

  it('내용이 있는 질문은 삭제 전에 확인을 받는다', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await user.click(screen.getByRole('button', { name: /새 면접 기록하기/ }))
    await user.type(screen.getByLabelText(/회사·기관명/), 'A')
    await user.type(screen.getByLabelText(/지원 직무/), 'B')
    await user.click(screen.getByRole('button', { name: /질문 기록하기/ }))
    await user.type(screen.getByLabelText('면접관이 어떤 질문을 했나요?'), '질문')
    await user.click(screen.getByRole('button', { name: /^삭제$/ }))
    const alert = screen.getByRole('alert')
    expect(within(alert).getByText(/삭제할까요/)).toBeTruthy()
    await user.click(within(alert).getByRole('button', { name: '취소' }))
    expect((screen.getByLabelText('면접관이 어떤 질문을 했나요?') as HTMLTextAreaElement).value).toBe('질문')
  })
})
