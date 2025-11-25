import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use a relative base so the app renders correctly whether it's served from
  // GitHub Pages, a sub-path, or a local file:// preview.
  base: './',
})
