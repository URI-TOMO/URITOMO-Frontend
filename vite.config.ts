import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

/* export default defineConfig({ base: './', */
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : './',
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        // 메인 프로세스 진입점
        entry: 'electron/main.ts',
        vite: {
          build: {
            // 빌드 설정 명시
            outDir: 'dist-electron', 
            rollupOptions: {
              external: ['electron'] // electron 모듈을 번들링에서 제외
            }
          }
        }
      },
      preload: {
        // 프리로드 스크립트 입력
        input: 'electron/preload.ts',
      },
      // 렌더러 프로세스에서 Electron API 사용 지원
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))