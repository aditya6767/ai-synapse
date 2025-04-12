// frontend/vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Base URL for assets needs to match Django's STATIC_URL
  base: '/static/',

  build: {
    // Output directory for production build.
    // IMPORTANT: Adjust this path relative to the 'frontend' directory.
    // This example assumes Vite builds into 'backend/static/dist/'.
    // Change '../backend/static/dist' if your structure is different!
    outDir: '../ai_synapse/static/dist',

    // Generate manifest.json for django-vite
    manifest: true,

    // Define your JavaScript entry point(s)
    rollupOptions: {
      input: {
        main: 'src/main.js', // Points to frontend/src/main.js
      },
    },

    // Put assets directly in outDir without an 'assets' subfolder
    assetsDir: '',
    // Clean the output directory before building
    emptyOutDir: true,
  },

  server: {
    // Configuration for Vite's development server
    origin: 'http://127.0.0.1:5173', // Helps with HMR connection
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
});