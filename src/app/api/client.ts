import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const baseURL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '');

// 1. Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
});

// 2. 요청 인터셉터 (Request Interceptor)
// 요청을 보내기 전에 가로채서 Access Token이 있다면 헤더에 주입합니다.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('uri-tomo-token');
    // 회원가입(/signup) 및 로그인(/general_login) 요청 시에는 토큰을 보내지 않음
    if (token && !config.url?.includes('/signup') && !config.url?.includes('/general_login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 🔍 요청 로깅
    console.log(`
---
[Renderer API Log]
${JSON.stringify({
      type: 'REQUEST',
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data
    }, null, 2)}
`);

    // 📝 터미널(메인 프로세스) 로깅 추가
    if ((window as any).electron?.sendSignal) {
      (window as any).electron.sendSignal('log', {
        type: 'REQUEST',
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: config.headers,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]:', error);
    return Promise.reject(error);
  }
);

// 3. 응답 인터셉터 (Response Interceptor)
// 응답을 받은 후, 에러가 발생하면 공통적으로 처리합니다.
apiClient.interceptors.response.use(
  (response) => {
    // 🔍 성공 응답 로깅
    console.log(`
---
[Renderer API Log]
${JSON.stringify({
      type: 'RESPONSE',
      status: response.status,
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      data: response.data
    }, null, 2)}
`);

    // 📝 터미널(메인 프로세스) 로깅 추가
    if ((window as any).electron?.sendSignal) {
      (window as any).electron.sendSignal('log', {
        type: 'RESPONSE',
        status: response.status,
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        data: response.data
      });
    }

    // 응답 데이터만 바로 반환하여 사용하기 편하게 함
    return response.data;
  },
  (error: AxiosError) => {
    // 🔍 에러 응답 로깅
    console.log(`
---
[Renderer API Log]
${JSON.stringify({
      type: 'RESPONSE_ERROR',
      status: error.response?.status || 'Unknown',
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      error: error.message,
      data: error.response?.data
    }, null, 2)}
`);

    // 에러 상태 코드별 처리
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 401: // 인증 실패 (토큰 만료 등)
          // 토큰 삭제 및 로그인 페이지로 리다이렉트 처리 가능
          localStorage.removeItem('uri-tomo-token');
          // window.location.href = '/login'; // 필요 시 주석 해제
          toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
          break;
        case 403: // 권한 없음
          toast.error('접근 권한이 없습니다.');
          break;
        case 500: // 서버 에러
          toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;
        default:
          toast.error(data?.detail || '알 수 없는 오류가 발생했습니다.');
      }
    } else if (error.request) {
      // 요청은 보냈으나 응답을 못 받은 경우 (네트워크 에러)
      if (error.code === 'ECONNABORTED') {
        toast.error(`백엔드 서버에 연결할 수 없습니다.\n서버가 실행 중인지 확인해주세요. (${baseURL})`);
      } else {
        toast.error('서버와 연결할 수 없습니다. 네트워크를 확인해주세요.');
      }
    } else {
      toast.error('요청 설정 중 오류가 발생했습니다.');
    }

    // 📝 터미널(메인 프로세스) 로깅 추가
    if ((window as any).electron?.sendSignal) {
      (window as any).electron.sendSignal('log', {
        type: 'RESPONSE_ERROR',
        status: error.response?.status,
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        error: error.message,
        data: error.response?.data
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;