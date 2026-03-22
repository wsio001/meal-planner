import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// TODO: change base to match your GitHub repo name, e.g. '/meal-planner/'
export default defineConfig({
  plugins: [react()],
  base: '/meal-planner/',
  server: {
    proxy: {
      '/api/kroger': {
        target: 'https://api.kroger.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kroger/, ''),
        secure: true,
      }
    }
  }
});