import { app, BrowserWindow, ipcMain, desktopCapturer, session } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

// ★重要: コールバックを保存する変数は関数の外に置く
let screenShareCallback: ((result: any) => void) | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'), // ビルド後のパスに注意
      contextIsolation: true, // trueでないとpreloadが動きません
      nodeIntegration: false,
    },
    icon: path.join(process.env.VITE_PUBLIC || '', 'app-icon.png'),
  })

  // ▼▼▼ 画面共有リクエストのハンドリング ▼▼▼
  win.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    console.log('[Main] DisplayMediaRequest received');

    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      console.log('[Main] Found sources:', sources.length);

      // コールバックをグローバル変数に保存（Reactからの選択待ち）
      screenShareCallback = callback;

      // React側に送るデータを作成
      const availableSources = sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }));

      // Reactへ「選択画面を出して」と送信
      win?.webContents.send('open-screen-picker', availableSources);
    }).catch((err) => {
      console.error('[Main] Screen capture error:', err);
      callback(null as any);
    });
  });
  // ▲▲▲ ここまで ▲▲▲

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.whenReady().then(() => {
  createWindow()



  // ▼▼▼ Reactからの選択結果を受け取る処理 ▼▼▼
  ipcMain.handle('select-screen-source', async (_, sourceId: string | null) => {
    console.log('[Main] Received selection:', sourceId);

    if (!screenShareCallback) {
      console.warn('[Main] No callback waiting');
      return;
    }

    if (sourceId) {
      // 指定されたIDのソースを再取得して渡す
      const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
      const selectedSource = sources.find(s => s.id === sourceId);

      if (selectedSource) {
        console.log('[Main] Starting share with:', selectedSource.name);
        // audio: false にして安定性を優先
        screenShareCallback({ video: selectedSource as any, audio: false });
      } else {
        console.error('[Main] Source not found');
        screenShareCallback(null as any);
      }
    } else {
      console.log('[Main] User cancelled');
      screenShareCallback(null as any);
    }
    screenShareCallback = null; // リセット
  });

  // 📝 프론트엔드 로그를 터미널(메인 프로세스)에 출력하기 위한 리스너
  ipcMain.on('log', (_, data) => {
    if (typeof data === 'string') {
      console.log('\x1b[36m%s\x1b[0m', `[Renderer Log] ${data}`);
    } else {
      console.log('\x1b[36m%s\x1b[0m', `[Renderer API Log]`);
      console.dir(data, { depth: null, colors: true });
    }
  });
})