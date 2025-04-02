import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    open: true,
    https: true,
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
