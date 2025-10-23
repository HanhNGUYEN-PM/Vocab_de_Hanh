import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Remplacez 'YOUR_REPO_NAME' par le nom de votre dépôt GitHub.
  base: '/YOUR_REPO_NAME/', 
})
