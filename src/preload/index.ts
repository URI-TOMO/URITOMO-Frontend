import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 커스텀 API 정의
const api = {
  auth: {
    saveToken: (token: string) => ipcRenderer.invoke('auth:save-token', token),
    getToken: () => ipcRenderer.invoke('auth:get-token'),
    logout: () => ipcRenderer.invoke('auth:clear-token'),
  },
  // 앱 제어 API
  app: {
    resizeWindow: (width: number, height: number) => ipcRenderer.invoke('window:resize', width, height),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
  },
  // LiveKit API
  livekit: {
    getToken: (roomName: string, participantName: string) => 
      ipcRenderer.invoke('livekit:get-token', roomName, participantName),
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api) // 우리가 만든 api 노출
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}