// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        listings: resolve(__dirname, 'listings/index.html'),
        listingDtl: resolve(__dirname, 'listings/detail.html'),
        listingCreate: resolve(__dirname, 'listings/create.html'),
        listingEdit: resolve(__dirname, 'listings/edit.html'),
        dashboard: resolve(__dirname, 'user/dashboard.html'),
      },
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
