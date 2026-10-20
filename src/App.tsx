import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
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
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <InterviewStoreProvider>
      {/* GitHub Pages에서 새로고침 404를 피하려고 Hash Router를 쓴다 */}
      <HashRouter>
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
      </HashRouter>
    </InterviewStoreProvider>
  )
}
