// 공통적인 유저 정보 구조
export interface UserProfile {
  id: string;
  email: string;
  display_name: string; // Python: name -> JSON: display_name (확인 필요, 보통 name 그대로 옴)
  picture?: string;
  locale?: string;
}

// 로그인 성공 시 받는 응답 (google_login.py의 TokenResponse 참고)
export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  user: UserProfile;
}

// 공통 에러 응답 구조
export interface ApiError {
  detail: string;
}