import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 개발 서버는 /api 요청을 Spring Boot(8081)로 프록시 → 브라우저 입장에서는 같은 Origin 이라 CORS 불필요
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:8081',
    },
  },
})
