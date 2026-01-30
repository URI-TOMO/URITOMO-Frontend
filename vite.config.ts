import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import electron from "vite-plugin-electron/simple"

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  // Use VITE_API_URL or VITE_BACKEND_URL if available
  const target = env.VITE_API_URL || env.VITE_BACKEND_URL 

  console.log('🔗 Proxy target set to:', target)

  return {
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
        '/signup': {
          target: target,
          changeOrigin: true,
        },
        '/general_login': {
          target: target,
          changeOrigin: true,
        },
        '/auth': {
          target: target,
          changeOrigin: true,
        },
        '/meeting': {
          target: target,
          changeOrigin: true,
        },
        '/rooms': {
          target: target,
          changeOrigin: true,
        },
        '/example': {
          target: target,
          changeOrigin: true,
        },
        '/user': {
          target: target,
          changeOrigin: true,
        },
        '/room': {
          target: target,
          changeOrigin: true,
        },
      }
    },
  }
})