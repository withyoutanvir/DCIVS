import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: 'buffer/',
      process: 'process/browser',
    },
  },
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
});