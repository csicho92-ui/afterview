import { Link } from 'react-router-dom'
import { AppShell } from '../components/Layout'

export function NotFound() {
  return (
    <AppShell>
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold">기록을 찾을 수 없어요</h1>
        <p className="mt-2 text-muted">
          삭제되었거나 다른 브라우저에서 작성한 기록일 수 있어요. 기록은 작성한 브라우저에만 저장됩니다.
        </p>
        <Link to="/" className="btn-primary btn mt-6">처음으로</Link>
      </div>
    </AppShell>
  )
}
