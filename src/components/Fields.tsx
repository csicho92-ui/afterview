import { useEffect, useId, useRef, type TextareaHTMLAttributes } from 'react'

type AutoTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  value: string
  onValueChange: (v: string) => void
  minRows?: number
}

/** 입력 길이에 맞춰 자동으로 늘어나는 텍스트 영역 */
export function AutoTextarea({ value, onValueChange, minRows = 3, className = '', ...rest }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`input ${className}`}
      style={{ minHeight: `${minRows * 1.65 + 1.6}rem` }}
      {...rest}
    />
  )
}

type TextFieldProps = {
  label: string
  value: string
  onValueChange: (v: string) => void
  hint?: string
  minRows?: number
  placeholder?: string
  chips?: string[]
  id?: string
  autoFocus?: boolean
  onKeyDown?: TextareaHTMLAttributes<HTMLTextAreaElement>['onKeyDown']
}

/** 라벨, 빠른 입력 칩이 붙은 텍스트 영역 */
export function TextAreaField({ label, value, onValueChange, hint, minRows = 2, placeholder, chips, id, autoFocus, onKeyDown }: TextFieldProps) {
  const auto = useId()
  const fieldId = id ?? auto
  const append = (chip: string) => {
    const v = value.trim()
    onValueChange(v ? `${v}${/[.!?。]$/.test(v) ? ' ' : ', '}${chip}` : chip)
  }
  return (
    <div>
      <label htmlFor={fieldId} className="field-label">
        {label}
      </label>
      <AutoTextarea
        id={fieldId}
        value={value}
        onValueChange={onValueChange}
        minRows={minRows}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        aria-describedby={hint ? `${fieldId}-hint` : undefined}
      />
      {hint && (
        <p id={`${fieldId}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {chips && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label={`${label} 빠른 입력`}>
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => append(c)}
              className="min-h-8 rounded-full bg-sage-soft px-3 text-[13px] text-[#4d5e51] transition-colors hover:bg-sage/25"
            >
              + {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
