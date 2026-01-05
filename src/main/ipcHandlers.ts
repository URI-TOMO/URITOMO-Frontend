import { ipcMain, safeStorage, BrowserWindow } from 'electron';
import { AccessToken } from 'livekit-server-sdk';
import * as dotenv from 'dotenv';
import store from './store';

dotenv.config();

export function setupHandlers(): void {
  // --- 1. 보안 토큰 관리 (Auth) ---
  
  // 토큰 저장 (암호화)
  ipcMain.handle('auth:save-token', (_, token: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
      console.error('SafeStorage is not available on this OS');
      return false;
    }
    const encryptedBuffer = safeStorage.encryptString(token);
    // Buffer를 저장하기 위해 base64 문자열로 변환
    store.set('auth_token_encrypted', encryptedBuffer.toString('base64'));
    return true;
  });

  // 토큰 불러오기 (복호화)
  ipcMain.handle('auth:get-token', () => {
    const encryptedString = store.get('auth_token_encrypted');
    if (!encryptedString || !safeStorage.isEncryptionAvailable()) return null;

    try {
      const buffer = Buffer.from(encryptedString, 'base64');
      const decryptedToken = safeStorage.decryptString(buffer);
      return decryptedToken;
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      return null;
    }
  });

  // 토큰 삭제 (로그아웃)
  ipcMain.handle('auth:clear-token', () => {
    store.delete('auth_token_encrypted');
    return true;
  });

  // LiveKit 토큰 발급 (개발용 임시 백엔드 역할)
  ipcMain.handle('livekit:get-token', async (_, roomName: string, participantName: string) => {
    console.log('--- [Main] 토큰 생성 시도 시작 ---');
    
    try {
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;
      const wsUrl = process.env.LIVEKIT_URL;

      // 1. 키 값 검증 로그
      if (!apiKey || !apiSecret || !wsUrl) {
        throw new Error('환경변수(.env)가 비어있습니다.');
      }
      
      // 2. 토큰 생성 객체 초기화
      console.log(`[Main] AccessToken 객체 생성 중... (Key 길이: ${apiKey.length})`);
      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
      });

      // 3. 권한 부여
      at.addGrant({ roomJoin: true, room: roomName });

      // 4. JWT 변환 (여기서 에러가 많이 발생함)
      console.log('[Main] JWT 변환 시도...');
      const token = await at.toJwt();
      
      console.log('[Main] 토큰 생성 성공! (길이: ' + token.length + ')');
      
      return { token, url: wsUrl };

    } catch (error: any) {
      // 5. 에러 발생 시 상세 로그 출력
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('[Main] 토큰 생성 치명적 오류 발생:');
      console.error(error);
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      
      // 렌더러로 에러 던지기
      throw error;
    }
  });

  // --- 2. 일반 설정 관리 (Settings) ---

  // 설정 읽기
  ipcMain.handle('settings:get', (_, key: string) => {
    return store.get(`settings.${key}`);
  });

  // 설정 쓰기
  ipcMain.handle('settings:set', (_, key: string, value: any) => {
    store.set(`settings.${key}`, value);
    return true;
  });

  // 윈도우 크기 조절 핸들러
  ipcMain.handle('window:resize', (_, width: number, height: number) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.setSize(width, height, true); // true = 애니메이션 적용
      win.center(); // 화면 중앙으로 이동
      return true;
    }
    return false;
  });
}