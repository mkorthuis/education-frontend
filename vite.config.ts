import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    open: true,
    https: true,
    // Local dev against the production API: VITE_PROXY_API=1 VITE_API_BASE_URL= npm run dev
    // (the API only allows the www.nhfacts.com origin, so calls go through this same-origin proxy)
    proxy: process.env.VITE_PROXY_API
      ? { '/api': { target: 'https://api.nhfacts.com', changeOrigin: true } }
      : undefined,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "src/setupTests",
    mockReset: true,
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@features': '/src/features',
      '@store': '/src/store',
      '@routes': '/src/routes',
      '@services': '/src/services'
    },
  },
})
