import { ArrowDown, ArrowUp, ChevronDown, Copy, Trash2 } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { questionHasContent, type Question } from '../types/interview'
import { TextAreaField } from './Fields'

const REACTION_CHIPS = ['고개를 끄덕였다', '추가 질문을 했다', '메모를 했다', '표정 변화가 없었다', '기억나지 않음']
const FEELING_CHIPS = ['자신 있었다', '긴장했다', '당황했다', '답이 길어졌다', '아쉬웠다']

type Props = {
  q: Question
  index: number
  total: number
  open: boolean
  autoFocus: boolean
  onToggle: () => void
  onChange: (patch: Partial<Question>) => void
  onMove: (dir: -1 | 1) => void
  onDuplicate: () => void
  onDelete: () => void
  onQuickAdd: () => void
}

export function QuestionCard({ q, index, total, open, autoFocus, onToggle, onChange, onMove, onDuplicate, onDelete, onQuickAdd }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [showMore, setShowMore] = useState(Boolean(q.regret || q.memo))
  const num = String(index + 1).padStart(2, '0')
  const filled = [q.answer, q.reaction, q.feeling, q.regret].filter((v) => v.trim()).length
  const bodyId = `${q.id}-body`

  // Ctrl/⌘ + Enter로 다음 질문을 바로 추가
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onQuickAdd()
    }
  }

  const askDelete = () => (questionHasContent(q) ? setConfirming(true) : onDelete())

  return (
    <article className={`card overflow-hidden transition-shadow ${open ? 'shadow-[0_1px_0_#e4e1da,0_8px_24px_-16px_rgba(37,40,45,.25)]' : ''}`}>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left sm:px-5"
        >
          <span className="shrink-0 font-mono text-xs font-semibold tracking-wider text-navy">Q{num}</span>
          <span className={`min-w-0 flex-1 truncate ${q.question ? 'font-semibold' : 'text-muted'}`}>
            {q.question || '아직 질문을 적지 않았어요'}
          </span>
          {!open && filled > 0 && <span className="hidden shrink-0 text-xs text-sage sm:inline">메모 {filled}개</span>}
          <ChevronDown className={`size-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div id={bodyId} className="space-y-5 border-t border-line px-4 pb-4 pt-5 sm:px-5">
          <TextAreaField
            label="면접관이 어떤 질문을 했나요?"
            value={q.question}
            onValueChange={(v) => onChange({ question: v })}
            placeholder="정확한 문장이 아니어도 괜찮아요"
            minRows={2}
            autoFocus={autoFocus}
            onKeyDown={onKeyDown}
          />
          <TextAreaField
            label="어떻게 답변했나요?"
            value={q.answer}
            onValueChange={(v) => onChange({ answer: v })}
            placeholder="기억나는 핵심 내용, 예시, 순서를 적어 보세요"
            minRows={4}
            onKeyDown={onKeyDown}
          />
          <TextAreaField
            label="면접관의 반응은 어땠나요?"
            value={q.reaction}
            onValueChange={(v) => onChange({ reaction: v })}
            placeholder="표정, 추가 질문, 말투 등"
            chips={REACTION_CHIPS}
            onKeyDown={onKeyDown}
          />
          <TextAreaField
            label="그때 어떤 기분이었나요?"
            value={q.feeling}
            onValueChange={(v) => onChange({ feeling: v })}
            chips={FEELING_CHIPS}
            onKeyDown={onKeyDown}
          />

          {showMore ? (
            <>
              <TextAreaField
                label="지금 생각하면 아쉬운 점은?"
                value={q.regret}
                onValueChange={(v) => onChange({ regret: v })}
                placeholder="다시 답한다면 바꾸고 싶은 부분"
                onKeyDown={onKeyDown}
              />
              <TextAreaField
                label="추가 메모"
                value={q.memo}
                onValueChange={(v) => onChange({ memo: v })}
                onKeyDown={onKeyDown}
              />
            </>
          ) : (
            <button type="button" className="btn-ghost btn -ml-2 px-2 text-sm" onClick={() => setShowMore(true)}>
              + 아쉬운 점 · 추가 메모 적기
            </button>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            {confirming ? (
              <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl bg-terracotta-soft px-3 py-2" role="alert">
                <span className="text-sm text-charcoal">Q{num}의 내용을 삭제할까요? 되돌릴 수 없어요.</span>
                <span className="flex gap-1">
                  <button type="button" className="btn-ghost btn min-h-9 text-sm" onClick={() => setConfirming(false)}>
                    취소
                  </button>
                  <button type="button" className="btn min-h-9 bg-terracotta text-sm text-white hover:bg-[#a96e5a]" onClick={onDelete}>
                    삭제
                  </button>
                </span>
              </div>
            ) : (
              <>
                <div className="flex">
                  <button type="button" className="icon-btn" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Q${num} 위로 이동`}>
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" className="icon-btn" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Q${num} 아래로 이동`}>
                    <ArrowDown className="size-4" />
                  </button>
                  <button type="button" className="icon-btn" onClick={onDuplicate} aria-label={`Q${num} 복제`}>
                    <Copy className="size-4" />
                  </button>
                </div>
                <button type="button" className="btn-ghost btn min-h-10 px-3 text-sm hover:text-terracotta" onClick={askDelete}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
