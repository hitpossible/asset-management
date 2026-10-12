import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Concurrent dev servers and SSR checks must not overwrite each other's optimizer output.
  cacheDir: `node_modules/.vite-tbkk/${process.pid}`,
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-icons/lu', 'qrcode-generator'],
  },
  plugins: [react(), tailwindcss()],
})
