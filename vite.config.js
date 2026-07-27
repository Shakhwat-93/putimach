import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api/pathao': {
          target: env.VITE_PATHAO_BASE_URL || 'https://courier-api-sandbox.pathao.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/pathao/, ''),
        },
        '/admin-api': {
          target: 'http://localhost:8001',
          changeOrigin: true,
        },
        '/admin': {
          target: 'http://localhost:5174',
          changeOrigin: true,
          bypass: (req, res) => {
            const [pathname] = req.url.split('?');
            if (pathname === '/admin') {
              const query = req.url.slice(pathname.length);
              res.writeHead(302, { Location: '/admin/' + query });
              res.end();
              return false;
            }
          }
        },
      },
    },
  };
})

