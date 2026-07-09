import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '.next/**', 'cypress/**'],
    include: [
      'app/**/*.test.ts',
      'app/**/*.test.tsx',
      'components/**/*.test.ts',
      'components/**/*.test.tsx',
      'lib/**/*.test.ts',
      'lib/**/*.test.tsx',
    ],
  },
})
