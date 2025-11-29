import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Utilise un chemin relatif pour éviter les écrans blancs si la base GitHub Pages n'est pas configurée.
  base: './',
})
