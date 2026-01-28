// 공통적인 유저 정보 구조
export interface UserProfile {
  id: string;
  email: string;
  display_name: string; // Python: name -> JSON: display_name (확인 필요, 보통 name 그대로 옴)
  picture?: string;
  lang?: string;
  country?: string;
  locale?: string;
}

// 로그인 성공 시 받는 응답 (backend TokenResponse 참고)
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  // Legacy support for older components
  user?: UserProfile;
}

// 공통 에러 응답 구조
export interface ApiError {
  detail: string;
}

// 로그인 요청 데이터 타입
export interface LoginRequest {
  email: string;
  password: string;
}

// 회원가입 요청 데이터 타입
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  lang: string;
}

// 메인 페이지 데이터 관련 타입
export interface MainUser {
  display_name: string;
  email: string;
  lang: string;
}

export interface Friend {
  id: string;
  friend_name: string;
  email: string;
}

export interface Room {
  id: string;
  name: string;
}

export interface RoomMember {
  id: string;
  name: string;
  status: string;
  locale?: string;
}

export interface RoomDetailResponse {
  id: string;
  name: string;
  members: RoomMember[];
  participant_count: number;
}

// Room member management
export interface AddRoomMemberRequest {
  email: string;
}

export interface AddRoomMemberResponse {
  id: string;
  name: string;
  locale: string;
}

export interface MainDataResponse {
  user: MainUser;
  friend_count: number;
  user_friends: Friend[];
  rooms: Room[];
}

// LiveKit 관련 타입
export interface LivekitTokenRequest {
  room_id: string;
}

export interface LivekitTokenResponse {
  url: string;
  token: string;
}

// 친구 추가 관련 타입
export interface AddFriendRequest {
  email: string;
}

export interface AddFriendResponse {
  id: string;
  name: string;
  email: string;
  lang: string;
}

export interface UpdateNicknameRequest {
  friendId: string;
  nickname: string;
}

export interface UpdateNicknameResponse {
  friendId: string;
  nickname: string;
  updatedAt: string;
}
