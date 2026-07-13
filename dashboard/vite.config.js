import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Anytime React asks for /api, Vite secretly forwards it to your Kubernetes tunnel!
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})