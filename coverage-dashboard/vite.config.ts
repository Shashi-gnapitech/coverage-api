import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'codeCoverage',
      filename: 'remoteEntry.js',
      exposes: {
        './mount': './src/mount.tsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    host: true,   // listen on 0.0.0.0 — required when running inside Docker
    port: 5173,
    proxy: {
      '/api': {
        // In Docker the backend is reachable via its container name;
        // locally (outside Docker) use localhost:3500.
        target: process.env.VITE_API_URL ?? 'http://localhost:3500',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    port: 5173,
    cors: true,
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
