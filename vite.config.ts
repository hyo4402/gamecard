import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // QUAN TRỌNG: base './' giúp ứng dụng chạy được trong thư mục con (ví dụ: username.github.io/repo-name)
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});