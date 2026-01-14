import { ipcRenderer, contextBridge } from 'electron'

// 렌더러에서 사용할 수 있는 API 노출
contextBridge.exposeInMainWorld('electron', {
  // 예: IPC 메시지 전송
  sendSignal: (channel: string, data: any) => ipcRenderer.send(channel, data),
  // 예: API 호출 (번역, TTS 등)
  invokeApi: (channel: string, data: any) => ipcRenderer.invoke(channel, data),
  // 예: 메인 프로세스로부터의 이벤트 수신
  on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback)
    return () => ipcRenderer.removeAllListeners(channel)
  }
})