import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['buffer', 'stream-browserify'],
  },
});