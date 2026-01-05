"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const livekitServerSdk = require("livekit-server-sdk");
const dotenv = require("dotenv");
const Store = require("electron-store");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const dotenv__namespace = /* @__PURE__ */ _interopNamespaceDefault(dotenv);
const icon = path.join(__dirname, "../../resources/icon.png");
const store = new Store({
  defaults: {
    settings: {
      theme: "system",
      targetLang: "KO"
    }
  }
});
dotenv__namespace.config();
function setupHandlers() {
  electron.ipcMain.handle("auth:save-token", (_, token) => {
    if (!electron.safeStorage.isEncryptionAvailable()) {
      console.error("SafeStorage is not available on this OS");
      return false;
    }
    const encryptedBuffer = electron.safeStorage.encryptString(token);
    store.set("auth_token_encrypted", encryptedBuffer.toString("base64"));
    return true;
  });
  electron.ipcMain.handle("auth:get-token", () => {
    const encryptedString = store.get("auth_token_encrypted");
    if (!encryptedString || !electron.safeStorage.isEncryptionAvailable()) return null;
    try {
      const buffer = Buffer.from(encryptedString, "base64");
      const decryptedToken = electron.safeStorage.decryptString(buffer);
      return decryptedToken;
    } catch (error) {
      console.error("Failed to decrypt token:", error);
      return null;
    }
  });
  electron.ipcMain.handle("auth:clear-token", () => {
    store.delete("auth_token_encrypted");
    return true;
  });
  electron.ipcMain.handle("livekit:get-token", async (_, roomName, participantName) => {
    console.log("--- [Main] 토큰 생성 시도 시작 ---");
    try {
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;
      const wsUrl = process.env.LIVEKIT_URL;
      if (!apiKey || !apiSecret || !wsUrl) {
        throw new Error("환경변수(.env)가 비어있습니다.");
      }
      console.log(`[Main] AccessToken 객체 생성 중... (Key 길이: ${apiKey.length})`);
      const at = new livekitServerSdk.AccessToken(apiKey, apiSecret, {
        identity: participantName
      });
      at.addGrant({ roomJoin: true, room: roomName });
      console.log("[Main] JWT 변환 시도...");
      const token = await at.toJwt();
      console.log("[Main] 토큰 생성 성공! (길이: " + token.length + ")");
      return { token, url: wsUrl };
    } catch (error) {
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.error("[Main] 토큰 생성 치명적 오류 발생:");
      console.error(error);
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      throw error;
    }
  });
  electron.ipcMain.handle("settings:get", (_, key) => {
    return store.get(`settings.${key}`);
  });
  electron.ipcMain.handle("settings:set", (_, key, value) => {
    store.set(`settings.${key}`, value);
    return true;
  });
  electron.ipcMain.handle("window:resize", (_, width, height) => {
    const win = electron.BrowserWindow.getFocusedWindow();
    if (win) {
      win.setSize(width, height, true);
      win.center();
      return true;
    }
    return false;
  });
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  setupHandlers();
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
