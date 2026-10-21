import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@/branding': path.resolve(__dirname, 'packages/timecapsule/src/branding.js'),
      '@timecapsule/core': path.resolve(__dirname, 'packages/timecapsule/src/index.js'),
      '@/packages/studio/src/models': path.resolve(
        __dirname,
        'packages/timecapsule/src/models/index.js'
      ),
      '@/packages/studio/src/muapi': path.resolve(
        __dirname,
        'packages/timecapsule/src/client/index.js'
      ),
      '@/packages/studio/src/kie': path.resolve(
        __dirname,
        'packages/timecapsule/src/client/index.js'
      ),
    },
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://api.kie.ai',
        changeOrigin: true,
        rewrite: (reqPath) => reqPath.replace(/^\/api/, ''),
      },
    },
  },
});
