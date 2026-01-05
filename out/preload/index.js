"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  auth: {
    saveToken: (token) => electron.ipcRenderer.invoke("auth:save-token", token),
    getToken: () => electron.ipcRenderer.invoke("auth:get-token"),
    logout: () => electron.ipcRenderer.invoke("auth:clear-token")
  },
  // 앱 제어 API
  app: {
    resizeWindow: (width, height) => electron.ipcRenderer.invoke("window:resize", width, height)
  },
  settings: {
    get: (key) => electron.ipcRenderer.invoke("settings:get", key),
    set: (key, value) => electron.ipcRenderer.invoke("settings:set", key, value)
  },
  // LiveKit API
  livekit: {
    getToken: (roomName, participantName) => electron.ipcRenderer.invoke("livekit:get-token", roomName, participantName)
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
