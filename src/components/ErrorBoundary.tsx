import { Component, type ReactNode } from 'react'

/** 예기치 못한 오류가 나도 빈 화면 대신 안내와 복구 방법을 보여준다 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="card p-6">
          <h1 className="text-xl font-bold">화면을 불러오는 중 문제가 생겼어요</h1>
          <p className="mt-2 text-muted">작성한 기록은 브라우저에 저장되어 있어요. 처음 화면으로 돌아가 다시 시도해 주세요.</p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-ivory p-3 text-xs text-muted">{this.state.error.message}</pre>
          <button
            type="button"
            className="btn-primary btn mt-5"
            onClick={() => {
              try { window.location.hash = '' } catch { /* 주소 변경이 막힌 환경 */ }
              this.setState({ error: null })
            }}
          >
            처음으로
          </button>
        </div>
      </div>
    )
  }
}
