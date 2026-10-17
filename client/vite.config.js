import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // Drop Domain on Set-Cookie from the API so the browser binds the session to the dev page origin (localhost:5173), not 127.0.0.1
        cookieDomainRewrite: '',
      },
    },
  },
})
