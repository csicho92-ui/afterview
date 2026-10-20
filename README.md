# AFTERVIEW

> 면접이 끝난 뒤, 기억을 기록으로. 기록을 다음 기회로.

면접에서 받은 질문과 실제 답변, 면접관 반응을 빠르게 기록하고, ChatGPT·Claude·Gemini에 그대로 붙여넣을 수 있는 **AI 회고 프롬프트**로 정리해 주는 웹 서비스입니다. 회원가입도, 서버도, AI API 키도 필요 없습니다.

## 주요 기능

- **면접 기록 생성** — 회사·직무만 적으면 시작, 나머지 정보는 선택 입력
- **질문 카드 기록** — 질문·답변·면접관 반응·감정·아쉬운 점·메모를 카드 단위로 기록
  - 빠른 입력 칩(“고개를 끄덕였다”, “긴장했다” 등), 자동으로 늘어나는 입력창
  - 질문 복제·순서 변경·삭제 확인, `Ctrl/⌘ + Enter`로 다음 질문 바로 추가
- **가이드형 회고** — 핵심 질문 5개 내외, 원하면 “더 깊이 회고하기”로 확장. 입사 의향이 불확실하면 우려 사항 질문이 자동으로 추가됨
- **프롬프트 생성 엔진** — 분석 모드(종합 / 답변 집중 / 조직 적합성 / 다음 면접 준비, 복수 선택), 톤, 깊이에 따라 결과 항목이 바뀜. 적지 않은 내용은 `미기록`으로 표시해 AI가 지어내지 않도록 함
- **미리보기·복사·Markdown 저장** — 복사가 막힌 환경에서는 수동 복사로 안내
- **개인정보 확인** — 공유 전 안내와 휴대전화·이메일·주민번호 패턴 감지
- **자동 저장** — 입력 즉시 브라우저(LocalStorage)에 저장, 새로고침·탭 닫기 후 복원
- **기록 보관함** — 여러 면접 관리, AI 회고 결과 보관, JSON 백업·복원

## 기술 스택

React 19 · TypeScript · Vite · Tailwind CSS v4 · Zod · Lucide React · React Router (Hash Router) · Vitest

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 프롬프트 엔진·저장소 단위 테스트
npm run build    # dist/ 에 정적 파일 생성
```

## 배포 (GitHub Pages)

1. 이 폴더를 GitHub 저장소의 `main` 브랜치에 푸시합니다.
2. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 바꿉니다.
3. `.github/workflows/deploy.yml` 이 테스트 → 빌드 → 배포를 자동으로 실행합니다.
4. 배포 주소: `https://<사용자명>.github.io/<저장소명>/`

`base: './'`와 Hash Router를 쓰기 때문에 저장소 이름과 관계없이, 새로고침해도 404 없이 동작합니다. Vercel에 올릴 때도 별도 설정이 필요 없습니다.

## 데이터 저장과 개인정보

- 모든 기록은 **사용 중인 브라우저의 LocalStorage에만** 저장되며 서버로 전송되지 않습니다.
- 외부 분석 도구나 추적 스크립트를 사용하지 않습니다.
- LocalStorage는 암호화된 저장소가 아니므로 공용 기기에서는 사용 후 기록을 삭제해 주세요.
- 브라우저 데이터 삭제나 기기 변경 시 기록이 사라질 수 있으니 **기록 보관함 → JSON 백업**을 이용하세요.
- 프롬프트는 사용자가 직접 복사해 AI 서비스에 붙여넣습니다. 자동으로 전송되지 않습니다.

## 프로젝트 구조

```
src/
├── components/   Layout, QuestionCard, Fields, InterviewListItem
├── pages/        Home, InterviewSetup, QuestionRecorder, Reflection, Prompt, Archive
├── hooks/        useInterviewStore (상태 + 자동 저장)
├── lib/          promptBuilder, storage, exportData
├── data/         reflectionQuestions (가이드형 회고 질문과 분기 규칙)
└── types/        interview (Zod 스키마, schemaVersion 포함)
tests/            promptBuilder.test.ts
docs/PRD.md       제품 요구사항 문서
```

## 향후 계획

- Phase 2 — 질문 태그·필터, 면접 간 인사이트 비교
- Phase 3 — 서버 측 AI API 연동, 반복 약점 분석 (키 관리·인증·동의 체계 선행)

## 라이선스

MIT
