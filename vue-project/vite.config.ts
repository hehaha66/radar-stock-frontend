// vite.config.ts

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
    ElementPlus({ useSource: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    open: true,
    proxy: {
      // 将所有以 /api 开头的请求代理到后端服务
      '/api': {
        target: 'http://127.0.0.1:8000', // 您的 FastAPI 后端地址
        changeOrigin: true, // 必须设置为 true
        rewrite: (path) => path.replace(/^\/api/, ''), // 去掉请求中的 /api 前缀
      },
    }
    // ==========================================================
  },
  appType: 'spa' // 确保这一行存在，以增强 SPA 的支持
})
