import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  base: '/',

  build: {
    // Standard output directory for SPA build (relative to frontend/)
    outDir: 'dist',
    manifest: true, // Good practice, useful for some deployment strategies
    rollupOptions: {
      // Vite uses index.html as the default input for SPAs
      input: resolve(__dirname, 'index.html'),
    },
  },

  server: {
    host: '127.0.0.1',
    port: 5173, // Vite dev server port
    strictPort: true,
    // --- Proxy API requests to Django backend during development ---
    proxy: {
      // Requests starting with /api will be forwarded to Django on port 8000
      '/api': {
        target: 'http://127.0.0.1:8000', // Your Django backend address
        changeOrigin: true, // Recommended for virtual hosts
        // secure: false, // Uncomment if Django uses HTTPS with self-signed cert (dev only)
      }
    }
    // -------------------------------------------------------------
  },
})
