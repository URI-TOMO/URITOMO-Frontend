# Uri-Tomo Meeting 🤝

언어의 장벽을 넘어 원활한 소통을 지원하는 현대적인 데스크톱 화상 회의 애플리케이션입니다. Uri-Tomo는 실시간 번역 기능과 고품질 화상 회의 기능을 통해 전 세계 사용자들을 연결합니다.

## 🚀 주요 기능

- **화상 회의 (Video Conferencing)**: [LiveKit](https://livekit.io/) 기반의 안정적인 고화질 영상 및 음성 통화 지원.
- **게스트 로그인 (Guest Login)**: 별도의 회원가입 없이 간편하게 접속할 수 있는 게스트 모드 제공.
- **실시간 번역 (Real-time Translation)**: DeepL 연동을 통해 언어 장벽 없는 커뮤니케이션 지원.
- **개발자 도구 (Developer Tools)**: 개발 및 테스트를 위한 빠른 로그인 단축 기능 제공.
- **현대적인 UI (Modern UI)**: Radix UI와 Tailwind CSS를 활용한 세련되고 반응성이 뛰어난 인터페이스.
- **사용자 설정 (Customizable Settings)**: 언어 설정 및 다양한 시스템 환경 설정 가능.

## 🛠 기술 스택 (Technology Stack)

- **Core**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Desktop Framework**: [Electron](https://www.electronjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **State Management & Routing**: React Router DOM, React Hook Form
- **Real-time Communication**: LiveKit Client SDK

## 📦 시작 가이드 (Getting Started)

### 사전 요구 사항 (Prerequisites)

- Node.js (v18 이상 권장)
- npm 또는 yarn

### 설치 방법 (Installation)

1. 저장소를 클론합니다:
   ```bash
   git clone <repository-url>
   cd uri-tomo
   ```

2. 의존성을 설치합니다:
   ```bash
   npm install
   ```

3. 환경 변수 설정:
   루트 디렉토리에 `.env` 파일을 생성하고 필요한 API 키(LiveKit, DeepL, Backend URL 등)를 설정합니다.

### 실행 방법 (Running the Application)

개발 모드 실행 (Electron + Vite):

```bash
npm run dev
```

배포용 빌드 생성:

```bash
npm run build
```

빌드 완료 후 `release` 디렉토리에 설치 파일이 생성됩니다.

## 📂 프로젝트 구조 (Project Structure)

```
uri-tomo/
├── electron/        # Electron 메인 프로세스 코드
├── src/             # React 애플리케이션 소스 코드
│   ├── app/         # 페이지 및 앱 로직
│   ├── components/  # 재사용 가능한 UI 컴포넌트
│   └── ...
├── dist/            # 빌드된 웹 에셋
├── release/         # 빌드된 Electron 애플리케이션
├── public/          # 정적 파일
└── ...
```

## 📝 라이선스

이 프로젝트는 비공개(Private) 프로젝트입니다.