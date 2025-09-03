import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/todolist-app/',
  build: {
    outDir: 'dist',
    // Image optimization settings
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    assetsDir: 'assets',
    rollupOptions: {
      external: (id) => {
        // Don't externalize React - keep it bundled
        return false
      },
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // Keep React with main vendor to avoid dependency loading issues
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor'
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor'
            }
            if (id.includes('@headlessui') || id.includes('@heroicons')) {
              return 'ui-vendor'
            }
            if (id.includes('react-big-calendar') || id.includes('date-fns')) {
              return 'calendar-vendor'
            }
            if (id.includes('@dnd-kit')) {
              return 'dnd-vendor'
            }
            if (id.includes('zustand')) {
              return 'state-vendor'
            }
            // Other vendor libraries
            return 'vendor'
          }
          
          // App chunks
          if (id.includes('/auth/') || id.includes('LoginPage') || id.includes('/services/auth')) {
            return 'auth'
          }
          if (id.includes('/tasks/') || id.includes('TasksPage')) {
            return 'tasks'
          }
          if (id.includes('/calendar/')) {
            return 'calendar'
          }
          if (id.includes('/groups/')) {
            return 'groups'
          }
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild',
    target: 'esnext'
  },
})