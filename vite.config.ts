import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import electron from "vite-plugin-electron/simple"

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : './',
  plugins: [
    react(),
    /*
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
              },
            }
          }
        }
      },
      preload: {
        input: 'electron/preload.ts',
      },
      renderer: {},
    }),
    */
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "motion/react": "framer-motion",
    },
  },
}))