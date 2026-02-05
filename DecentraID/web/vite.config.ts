import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable production optimizations
    minify: 'terser',
    chunkSizeWarningLimit: 1600,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Separate vendor chunks for better caching
            if (id.includes('ethers')) {
              return 'vendor/ethers'
            }
            if (id.includes('framer-motion')) {
              return 'vendor/framer-motion'
            }
            return 'vendor'
          }
        },
        // Ensure consistent chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  // Optimize dependencies for production
  optimizeDeps: {
    include: ['ethers', 'framer-motion', 'lucide-react'],
  },
})
