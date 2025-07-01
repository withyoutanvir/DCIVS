import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: 'buffer/',
      process: 'process/browser',
      stream: 'stream-browserify', // Optional, useful for polyfilling crypto streams
    },
  },
  define: {
    'process.env': {}, // Ensures compatibility with packages expecting process.env
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
});
