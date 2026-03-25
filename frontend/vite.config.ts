import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.FRONTEND_PORT) || 5173,
    watch: {
      usePolling: true,
    }
  }
});
