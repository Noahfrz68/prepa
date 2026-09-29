import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': import.meta.dirname },
  },
  test: {
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'pc',
          include: ['core/**/*.test.ts', 'exams/**/*.test.ts', 'app/**/*.test.ts'],
        },
      },
      {
        // Le parcours de bout en bout, rejoué sur la base du navigateur
        // (sql.js) : les mêmes routes et les mêmes requêtes doivent y tenir.
        extends: true,
        test: {
          name: 'navigateur',
          include: ['core/db/parcours.test.ts'],
          env: { PREPA_MOTEUR: 'sqljs' },
          setupFiles: ['core/db/moteur-navigateur.setup.ts'],
        },
      },
    ],
  },
})
