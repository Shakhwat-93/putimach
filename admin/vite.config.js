import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isNativeBuild = mode === 'native' || env.VITE_APP_PLATFORM === 'native';

  const plugins = [react()];

  return {
    base: isNativeBuild ? './' : '/admin/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('@supabase')) return 'vendor-supabase';
            return 'vendor-core';
          }
        }
      }
    },
    plugins,
    server: {
      port: 5174,
      watch: {
        ignored: ['**/node_modules_old/**']
      },
      proxy: {
        // Proxy courier and upload API calls to the Express backend
        '/admin-api': {
          target: 'http://localhost:8001',
          changeOrigin: true,
        },
        '/api/pathao': {
          target: env.VITE_PATHAO_BASE_URL || 'https://courier-api-sandbox.pathao.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/pathao/, ''),
        }
      }
    }
  };
});
