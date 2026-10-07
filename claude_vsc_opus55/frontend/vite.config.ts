import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // 개발 중 /api 요청은 Spring Boot(8080)로 프록시 → 브라우저 입장에서는 같은 출처라 CORS 불필요
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
