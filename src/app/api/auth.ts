import apiClient from './client';
import { AuthResponse, UserProfile } from './types';
import { LoginRequest, SignupRequest } from './types';

// 백엔드의 google_login.py 라우터 prefix가 '/auth' 이므로 경로를 맞춥니다.
export const authApi = {
  /**
   * 구글 소셜 로그인
   * POST /auth/google
   */
  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    // axios interceptor 덕분에 .data를 안 붙여도 바로 AuthResponse 타입으로 반환됨
    return apiClient.post<any, AuthResponse>('/google', { token: idToken });
  },



  /**
   * 토큰 갱신
   * POST /auth/refresh
   */
  refreshToken: async (): Promise<AuthResponse> => {
    return apiClient.post<any, AuthResponse>('/refresh');
  },

  // 일반 로그인
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<any, AuthResponse>('/general_login', data);
  },

  // 회원가입
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    return apiClient.post<any, AuthResponse>('/signup', data);
  }
};