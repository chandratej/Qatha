/**
 * ESLint 9 flat config — enables `npm run lint` (eslint src/).
 * Keep rules light for the existing Express/ESM codebase.
 */
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'scripts/**',
      'coverage/**',
      '**/*.test.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-constant-condition': ['warn', { checkLoops: false }],
      // Common in Express routers / intentional fall-throughs
      'no-fallthrough': 'off',
    },
  },
];
