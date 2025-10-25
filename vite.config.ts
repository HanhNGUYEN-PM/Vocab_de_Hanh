import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from './package.json' assert { type: 'json' };

const homepage = typeof packageJson.homepage === 'string' ? packageJson.homepage : '';

const derivedBase = (() => {
  if (!homepage || homepage.includes('<')) {
    return '/';
  }

  try {
    const url = new URL(homepage);
    const cleanPath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
    return cleanPath === '//' ? '/' : cleanPath;
  } catch (error) {
    return '/';
  }
})();

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? derivedBase ?? '/',
});
