# Pull Request: 백엔드 통신 로깅 및 네트워크 연결 문제 해결

## 📋 개요

회원가입과 로그인 기능의 백엔드 통신 디버깅을 위한 로깅 시스템을 구축하고, 개발 환경에서 발생하는 네트워크 연결 문제(CSP 위반, CORS)를 해결했습니다.

## 🎯 목표

- ✅ 백엔드 API 통신 과정을 브라우저 콘솔에서 실시간으로 확인 가능
- ✅ 개발 환경에서 백엔드 서버(`10.0.255.80:8000`)와 정상적으로 통신
- ✅ CSP 및 CORS 문제 해결

## 🔧 주요 변경사항

### 1. 백엔드 통신 로깅 시스템 구축

#### `src/app/api/client.ts`
- **요청 인터셉터 강화**
  - 모든 API 요청 시 메서드, URL, 헤더, 요청 데이터, 타임스탬프 로깅
  - 이모지와 `console.group()`을 활용한 가독성 높은 로그 구조
  
- **응답 인터셉터 강화**
  - 성공: 상태 코드, 응답 데이터, 타임스탬프 로깅
  - 실패: 에러 코드, 메시지, 상세 정보 로깅
  - 네트워크 에러 타입별 세부 로깅 (타임아웃, 연결 거부 등)

#### `src/app/pages/Login.tsx`
- **로그인 핸들러 (`handleSubmit`)**
  - 시도 시점, 성공/실패 시점 로깅
  - 사용자 이메일, 토큰 수신 여부, 에러 정보 로깅

- **회원가입 핸들러 (`handleSignUp`)**
  - 시도 시점, 성공/실패 시점 로깅
  - 사용자 정보, 토큰 수신 여부, 에러 정보 로깅

**로그 예시:**
```
🚀 [API Request] POST /signup
  📍 Full URL: /signup
  📋 Headers: {...}
  📦 Request Data: {...}
  ⏱️ Timestamp: 2026-01-22T01:30:00.000Z

✅ [API Response] POST /signup
  🔢 Status: 201 Created
  📦 Response Data: { access_token: "...", user: {...} }
```

### 2. Content Security Policy (CSP) 설정

#### `index.html`
백엔드 서버 URL을 CSP `connect-src`에 추가하여 네트워크 요청 허용

```diff
- connect-src 'self' https: ws: http://localhost:8000;
+ connect-src 'self' https: ws: wss: http://localhost:8000 http://10.0.255.80:8000;
```

**추가된 항목:**
- `wss:` - 보안 WebSocket 지원 (LiveKit 등)
- `http://10.0.255.80:8000` - 백엔드 서버 URL

### 3. CORS 문제 해결 - Vite Proxy 설정

#### `vite.config.ts`
개발 환경에서 CORS 문제를 우회하기 위한 프록시 설정 추가

```typescript
server: {
  proxy: {
    '/signup': {
      target: 'http://10.0.255.80:8000',
      changeOrigin: true,
      secure: false,
    },
    '/general_login': {
      target: 'http://10.0.255.80:8000',
      changeOrigin: true,
      secure: false,
    },
    '/auth': {
      target: 'http://10.0.255.80:8000',
      changeOrigin: true,
      secure: false,
    },
  }
}
```

**작동 원리:**
- 브라우저는 같은 origin(`localhost:5173`)으로 요청
- Vite 개발 서버가 요청을 백엔드(`10.0.255.80:8000`)로 프록시
- CORS 문제 없이 통신 가능

#### `.env`
프록시를 사용하기 위해 API URL을 빈 문자열로 설정

```diff
- VITE_API_URL=http://10.0.255.80:8000
+ VITE_API_URL=
```

## 🐛 해결된 문제

### 1. Network Error (ERR_CONNECTION_REFUSED)
- **원인**: API URL이 `localhost:8000`으로 설정되어 있었으나 백엔드는 `10.0.255.80:8000`에서 실행 중
- **해결**: 올바른 백엔드 URL 설정 및 프록시 사용

### 2. CSP 위반
- **원인**: Content Security Policy가 `10.0.255.80:8000`으로의 연결을 차단
- **해결**: CSP `connect-src`에 백엔드 URL 추가

### 3. CORS Policy 위반
- **원인**: 백엔드 서버가 `localhost:5173` origin을 허용하지 않음
- **해결**: Vite proxy를 통해 같은 origin으로 요청하여 CORS 우회

## 📊 테스트 방법

### 로깅 확인
1. 브라우저 개발자 도구 열기 (`F12`)
2. Console 탭으로 이동
3. 로그인 또는 회원가입 시도
4. 다음 로그 확인:
   - `🚀 [API Request]` - 요청 시작
   - `✅ [API Response]` - 성공 응답
   - `❌ [API Error]` - 에러 발생
   - `🔐 [Login Attempt]` / `📝 [Sign Up Attempt]` - 사용자 액션
   - `✅ [Login Success]` / `❌ [Login Failed]` - 결과

### 실제 통신 테스트
1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 애플리케이션 접속
3. 회원가입 또는 로그인 시도
4. 정상적으로 백엔드와 통신되는지 확인

## 🔍 영향 범위

### 변경된 파일
- `src/app/api/client.ts` - API 클라이언트 로깅 추가
- `src/app/pages/Login.tsx` - 로그인/회원가입 로깅 추가
- `index.html` - CSP 설정 업데이트
- `vite.config.ts` - 프록시 설정 추가
- `.env` - API URL 변경

### 영향을 받는 기능
- 회원가입
- 일반 로그인
- 모든 백엔드 API 요청 (로깅 시스템)

### 하위 호환성
- ✅ 기존 기능 정상 작동
- ✅ 로깅은 추가 기능으로 기존 동작에 영향 없음
- ⚠️ 프로덕션 배포 시 추가 설정 필요 (아래 참고)

## ⚠️ 프로덕션 배포 시 주의사항

### 1. Vite Proxy는 개발 환경 전용
프로덕션에서는 작동하지 않으므로 백엔드에서 CORS 설정 필요:

```python
# FastAPI 예시
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",  # 프로덕션 도메인
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. 환경 변수 설정
`.env.production` 파일에 실제 백엔드 URL 설정:

```bash
VITE_API_URL=https://api.your-backend-domain.com
```

### 3. 로깅 제거 (선택사항)
프로덕션에서는 보안을 위해 상세한 로깅을 제거하는 것을 권장:
- Webpack/Vite 설정으로 `console.log` 제거
- 환경 변수로 로깅 활성화/비활성화

### 4. CSP 설정 강화
프로덕션에서는 보안을 위해 CSP를 더 엄격하게 설정:
- 와일드카드 제거
- 실제 사용하는 도메인만 명시
- HTTPS 사용

## 📝 추가 문서

프로젝트 루트에 다음 문서들이 생성되었습니다:
- `LOGGING_INFO.md` - 로깅 시스템 사용 가이드
- `.gemini/.../NETWORK_ERROR_SOLUTION.md` - 네트워크 에러 해결 과정
- `.gemini/.../CSP_SOLUTION.md` - CSP 문제 해결 과정
- `.gemini/.../CORS_SOLUTION.md` - CORS 문제 해결 과정

## ✅ 체크리스트

- [x] 코드 변경사항 검토
- [x] 로컬 환경에서 테스트
- [x] 로깅 기능 정상 작동 확인
- [x] 백엔드 통신 정상 작동 확인
- [x] 문서화 완료
- [ ] 코드 리뷰 요청
- [ ] 프로덕션 배포 전 CORS 설정 확인

## 👥 리뷰어에게

이 PR은 다음을 포함합니다:
1. **디버깅 도구 추가**: 개발 중 백엔드 통신 문제를 빠르게 파악할 수 있는 로깅 시스템
2. **개발 환경 설정**: CSP 및 CORS 문제 해결을 통한 원활한 개발 환경 구축

프로덕션 배포 전 백엔드 팀과 CORS 설정을 조율해야 합니다.

## 🔗 관련 이슈

- 회원가입/로그인 시 발생하는 `AxiosError: timeout of 10000ms exceeded` 문제 해결
- 백엔드 통신 디버깅 개선

---

**작성자**: Antigravity AI Assistant  
**작성일**: 2026-01-22  
**브랜치**: feature/backend-logging-and-network-fix
