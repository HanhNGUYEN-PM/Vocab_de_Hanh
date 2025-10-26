import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const explicitBase = process.env.VITE_BASE_PATH;

  return {
    plugins: [react()],
    base: explicitBase ?? (command === 'build' ? './' : '/'),
  };
});
