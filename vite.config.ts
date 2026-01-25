import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import electron from "vite-plugin-electron/simple"

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : './',
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      preload: {
        input: 'electron/preload.ts',
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "motion/react": "framer-motion",
    },
  },
  server: {
    proxy: {
      // API 요청을 백엔드 서버로 프록시
      '/signup': {
        target: 'http://10.0.255.80:8000',
        changeOrigin: true,
        secure: false,
      },
      '/general_login': {
        target: 'http://10.0.255.80:8000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://10.0.255.80:8000',
        changeOrigin: true,
        secure: false,
      },
    }
  },
}))