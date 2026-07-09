import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import cypress from 'eslint-plugin-cypress/flat'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({
  baseDirectory: dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const sourceFiles = ['**/*.{js,jsx,ts,tsx,mjs,cjs}']
const cypressFiles = ['cypress/**/*.{js,jsx,ts,tsx}', '**/*.cy.{js,jsx,ts,tsx}']

const config = [
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'dependency-audit-reports/**',
      'node_modules/**',
      'service/**',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    files: sourceFiles,
    rules: {
      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks: '(useSignaledEffect)',
        },
      ],
    },
  },
  {
    ...cypress.configs.recommended,
    files: cypressFiles,
    rules: {
      ...cypress.configs.recommended.rules,
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/assertion-before-screenshot': 'warn',
    },
  },
]

export default config
