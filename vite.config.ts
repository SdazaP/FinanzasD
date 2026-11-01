/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['src/**/*.test.{ts,tsx}'], environment: 'jsdom', setupFiles: ['src/test-setup.ts'] },
      },
      // Necesita el emulador de Firestore: npm run test:rules
      { test: { name: 'rules', include: ['tests/rules/**/*.test.ts'], environment: 'node' } },
    ],
  },
})
