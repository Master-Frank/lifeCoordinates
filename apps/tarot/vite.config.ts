import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const rootDir = path.dirname(fileURLToPath(import.meta.url));
  return {
    base: '/tarot/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      outDir: path.resolve(rootDir, '../web/public/tarot'),
      emptyOutDir: true
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      }
    }
  };
});
