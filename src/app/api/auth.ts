import apiClient from './client';
import { AuthResponse, UserProfile } from './types';
import { LoginRequest, SignupRequest } from './types';

// Google ログイン関数
// バックエンド app/user/google_login.py の /auth/google エンドポイントに対応

export const authApi = {
  /**
   * Google ログイン（テスト用トークン対応）
   * POST /auth/google
   * @param token - Google ID Token または test-token
   */
  googleLogin: async (token: string): Promise<AuthResponse> => {
    return apiClient.post<any, AuthResponse>('/auth/google', { token });
  },

  /**
   * トークン更新
   * POST /auth/refresh
   */
  refreshToken: async (): Promise<AuthResponse> => {
    return apiClient.post<any, AuthResponse>('/auth/refresh');
  },

  /**
   * メール/パスワード ログイン
   * POST /auth/general_login
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<any, AuthResponse>('/general_login', data);
  },

  /**
   * ユーザー登録
   * POST /auth/signup
   */
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    return apiClient.post<any, AuthResponse>('/signup', data);
  },

  /**
   * 現在のユーザー情報を取得
   * GET /auth/me
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    return apiClient.get<any, UserProfile>('/auth/me');
  }
};
