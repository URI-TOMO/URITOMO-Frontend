import Store from 'electron-store';

// 사용자 설정 타입 정의
interface UserSchema {
  auth_token_encrypted?: string; // 암호화된 토큰 (Base64)
  settings: {
    theme: 'system' | 'light' | 'dark';
    targetLang: string; // 번역 타겟 언어 (예: KO, EN)
  };
}

const store = new Store<UserSchema>({
  defaults: {
    settings: {
      theme: 'system',
      targetLang: 'KO',
    },
  },
});

export default store;