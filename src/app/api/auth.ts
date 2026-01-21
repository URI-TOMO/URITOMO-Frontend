import apiClient from './client';
import { AuthResponse, UserProfile } from './types';

// 백엔드의 google_login.py 라우터 prefix가 '/auth' 이므로 경로를 맞춥니다.
export const authApi = {
  /**
   * 구글 소셜 로그인
   * POST /auth/google
   */
  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    // axios interceptor 덕분에 .data를 안 붙여도 바로 AuthResponse 타입으로 반환됨
    return apiClient.post<AuthResponse>('/auth/google', { token: idToken });
  },

  /**
   * 내 정보 가져오기 (토큰 검증용)
   * GET /auth/me
   */
  getMe: async (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>('/auth/me');
  },

  /**
   * 토큰 갱신
   * POST /auth/refresh
   */
  refreshToken: async (): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/refresh');
  }
};