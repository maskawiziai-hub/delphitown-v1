// ESLint flat config.
//
// These rules exist because of specific defects this project actually shipped:
//   - react-hooks/rules-of-hooks  -> WorkerStatusWidget called a hook inside a
//     useEffect, which meant the list view never subscribed to anything.
//   - no-floating-promises        -> unawaited async calls in cleanup paths.
//   - no-unused-vars              -> 14 dead bindings accumulated unnoticed.
//   - no-non-null-assertion       -> ARCH-004 (type guards over assertions).
//
// Type-aware rules need the TS program, so `projectService` is on.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      // Build/config files live outside tsconfig's `include`, so the type-aware
      // project service cannot parse them. They are not application code.
      '*.config.js',
      '*.config.ts',
      'vite.env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // Rules of Hooks is non-negotiable - breaking it produces silent,
      // intermittent failures rather than errors.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Pragmatic: Supabase rows arrive as `any` at the boundary and are cast
      // at the edge. Warn so it stays visible without blocking the build.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    // Tests legitimately use loose typing and throwaway values.
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  }
);
