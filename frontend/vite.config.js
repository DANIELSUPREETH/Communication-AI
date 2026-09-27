import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Keep the charting library out of the landing-page bundle.
        manualChunks: { charts: ['recharts'], motion: ['framer-motion'] },
      },
    },
  },
});
