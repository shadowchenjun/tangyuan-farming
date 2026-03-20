import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const allowedHosts = process.env.ALLOWED_HOSTS
  ? process.env.ALLOWED_HOSTS.split(',')
  : ['localhost', '127.0.0.1']

export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts,
    proxy: {
      '/api': {
        target: process.env.API_TARGET || 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})