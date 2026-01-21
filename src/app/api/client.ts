import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 응답 인터셉터 (Response Interceptor)
// 응답을 받은 후, 에러가 발생하면 공통적으로 처리합니다.
apiClient.interceptors.response.use(
  (response) => {
    // 응답 데이터만 바로 반환하여 사용하기 편하게 함
    return response.data;
  },
  (error: AxiosError) => {
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
      toast.error('서버와 연결할 수 없습니다. 네트워크를 확인해주세요.');
    } else {
      toast.error('요청 설정 중 오류가 발생했습니다.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;