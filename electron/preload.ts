import { ipcRenderer, contextBridge } from 'electron'

// --- 既存のElectron API ---
contextBridge.exposeInMainWorld('electron', {
  sendSignal: (channel: string, data: any) => ipcRenderer.send(channel, data),
  invokeApi: (channel: string, data: any) => ipcRenderer.invoke(channel, data),
  on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback)
    return () => ipcRenderer.removeAllListeners(channel)
  }
})

// --- 画面共有用 API (これを追加！) ---
contextBridge.exposeInMainWorld('ipcRenderer', {
  // メインプロセスからの「選択画面出して！」を受け取る
  onOpenScreenPicker: (callback: (sources: any[]) => void) => {
    console.log('[Preload] Setup open-screen-picker listener');
    ipcRenderer.removeAllListeners('open-screen-picker');
    ipcRenderer.on('open-screen-picker', (_event, sources) => {
      console.log('[Preload] Received sources:', sources);
      callback(sources);
    });
  },
  
  // ユーザーが選んだIDをメインプロセスに送る
  selectScreenSource: (id: string | null) => {
    console.log('[Preload] Selecting source:', id);
    ipcRenderer.invoke('select-screen-source', id);
  }
})