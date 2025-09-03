// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        root: resolve(__dirname, 'index.html'), // listings landing now at /
        login: resolve(__dirname, 'login/index.html'),
        register: resolve(__dirname, 'register/index.html'),
        listingDetail: resolve(__dirname, 'listings/detail/index.html'),
        listingCreate: resolve(__dirname, 'listings/create/index.html'),
        listingEdit: resolve(__dirname, 'listings/edit/index.html'),
        dashboard: resolve(__dirname, 'user/dashboard/index.html'),
      },
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
