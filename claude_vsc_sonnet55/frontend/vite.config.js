import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 개발 중 /api 요청을 Spring Boot(기본 8090)로 프록시 -> CORS 설정 불필요
const target = process.env.API_TARGET || 'http://localhost:8090'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target, changeOrigin: true } } },
})
