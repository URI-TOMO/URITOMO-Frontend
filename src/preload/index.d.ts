import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      auth: {
        saveToken: (token: string) => Promise<boolean>
        getToken: () => Promise<string | null>
        logout: () => Promise<boolean>
      }
      app: {
        resizeWindow: (width: number, height: number) => Promise<boolean>
      }
      settings: {
        get: (key: string) => Promise<any>
        set: (key: string, value: any) => Promise<boolean>
      }
      livekit: {
        getToken: (roomName: string, participantName: string) => Promise<{ token: string; url: string }>
      }
    }
  }
}