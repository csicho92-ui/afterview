import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { HashRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { InterviewStoreProvider } from './hooks/useInterviewStore'
import { ArchivePage } from './pages/ArchivePage'
import { HomePage } from './pages/HomePage'
import { InterviewSetupPage } from './pages/InterviewSetupPage'
import { NotFound } from './pages/NotFound'
import { PromptPage } from './pages/PromptPage'
import { QuestionRecorderPage } from './pages/QuestionRecorderPage'
import { ReflectionPage } from './pages/ReflectionPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    try { window.scrollTo(0, 0) } catch { /* 무시 */ }
  }, [pathname])
  return null
}

// 미리보기(단일 파일) 빌드는 주소 변경이 막힌 환경에서 열리므로 주소를 바꾸지 않는 라우터를 쓴다.
// 실제 배포(GitHub Pages)는 새로고침 404를 피하려고 Hash Router를 쓴다.
function Router({ children }: { children: ReactNode }) {
  return import.meta.env.VITE_ROUTER === 'memory' ? <MemoryRouter>{children}</MemoryRouter> : <HashRouter>{children}</HashRouter>
}

export default function App() {
  return (
    <InterviewStoreProvider>
      <Router>
        <ErrorBoundary>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/interview/new" element={<InterviewSetupPage />} />
          <Route path="/interview/:id/setup" element={<InterviewSetupPage />} />
          <Route path="/interview/:id/questions" element={<QuestionRecorderPage />} />
          <Route path="/interview/:id/reflection" element={<ReflectionPage />} />
          <Route path="/interview/:id/prompt" element={<PromptPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </Router>
    </InterviewStoreProvider>
  )
}
