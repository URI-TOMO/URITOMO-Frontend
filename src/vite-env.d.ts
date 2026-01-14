/// <reference types="vite/client" />

interface Window {
  electron: {
    sendSignal: (channel: string, data: any) => void;
    invokeApi: (channel: string, data: any) => Promise<any>;
    on: (channel: string, callback: Function) => () => void;
  }
}