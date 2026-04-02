import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression'

const allowedHosts = process.env.ALLOWED_HOSTS
  ? process.env.ALLOWED_HOSTS.split(',')
  : ['localhost', '127.0.0.1']

export default defineConfig({
  plugins: [
    vue(),
    // gzip 压缩
    viteCompression({
      verbose: false,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz'
    }),
    // brotli 压缩
    viteCompression({
      verbose: false,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        // 动态分 chunk，基于 node_modules 路径
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Vue Router 独立 chunk
            if (id.includes('vue-router')) {
              return 'vue-router'
            }
            // Pinia 独立 chunk
            if (id.includes('pinia')) {
              return 'pinia'
            }
            // Element Plus 独立 chunk
            if (id.includes('element-plus')) {
              return 'element-plus'
            }
            // Vue 核心（最小同步 chunk）
            if (id.includes('vue') || id.includes('@vue')) {
              return 'vue-core'
            }
            // 图标库（按需）
            if (id.includes('@element-plus/icons-vue')) {
              return 'icons'
            }
            // axios
            if (id.includes('axios')) {
              return 'axios'
            }
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
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