import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': import.meta.dirname },
  },
  test: {
    include: ['core/**/*.test.ts', 'exams/**/*.test.ts', 'app/**/*.test.ts'],
    environment: 'node',
  },
})
