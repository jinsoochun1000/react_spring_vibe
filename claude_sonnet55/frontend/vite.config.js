import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 개발 서버에서 /api 호출을 Spring Boot 로 프록시 (CORS 불필요)
// 백엔드 포트가 다르면 VITE_API_TARGET 환경변수로 지정: VITE_API_TARGET=http://localhost:9090 npm run dev
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_PORT) || 5173,
      proxy: {
        '/api': { target: env.VITE_API_TARGET || 'http://localhost:8080', changeOrigin: true },
      },
    },
  }
})
