import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { AccessToken } from 'livekit-server-sdk'
import dotenv from 'dotenv'

// .env 파일 로드
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// 렌더러 프로세스(React)가 사용할 HTML 파일 경로
process.env.APP_ROOT = path.join(__dirname, '..')

// Vite 개발 서버 URL 및 빌드 결과물 경로 정의
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    // icon: path.join(process.env.VITE_PUBLIC, 'icon.png'), // 아이콘 파일이 있다면
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false, // 보안을 위해 false 유지
    },
  })

  // 개발 모드에서는 Vite 서버 URL 로드, 프로덕션에서는 빌드된 index.html 로드
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools() // 개발자 도구 열기
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// 앱이 준비되면 창 생성
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()

  // ▼ LiveKit 토큰 발급 핸들러 추가
  ipcMain.handle('get-livekit-token', async (_, { roomName, participantName }) => {
    try {
      const apiKey = process.env.LIVEKIT_API_KEY
      const apiSecret = process.env.LIVEKIT_API_SECRET
      const wsUrl = process.env.LIVEKIT_URL

      if (!apiKey || !apiSecret || !wsUrl) {
        throw new Error('LiveKit 환경 변수가 설정되지 않았습니다.')
      }

      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
        // 사용자 이름과 별개로 고유 ID가 필요하다면 여기서 처리 가능
      })

      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
      })

      const token = await at.toJwt()
      return { token, url: wsUrl }
    } catch (error) {
      console.error('Token generation failed:', error)
      throw error
    }
  })
})

// 추후 LiveKit, OpenAI API 통신을 위한 IPC 핸들러 예시
ipcMain.handle('api-request', async (event, data) => {
  console.log('Renderer requested:', data)
  // 여기에 Python 스크립트 실행이나 API 호출 로직 추가 예정
  return { success: true }
})