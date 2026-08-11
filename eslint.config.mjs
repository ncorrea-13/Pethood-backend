import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * ESLint 9 flat config (reemplaza .eslintrc.*).
 * Reglas alineadas con docs/CONSTITUTION.md: TypeScript strict, sin `any`, Prettier.
 */
export default tseslint.config(
  // Archivos/carpetas que nunca se lintan
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'prisma/migrations/**',
      '*.config.js',
      '*.config.cjs',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parserOptions: {
        // Type-aware linting sin tsconfig extra (typescript-eslint v8+)
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Constitución: prohibido `any` salvo justificación comentada
      '@typescript-eslint/no-explicit-any': 'error',

      // Variables no usadas: permitir prefijo `_` (params Express no usados, etc.)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Exigir tipo de retorno en APIs exportadas; no molestar en handlers inline
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],

      // Preferir import type { X } para imports solo de tipos
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // Evitar floating promises (jobs, handlers async sin await)
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],

      // console.log → warn; permitir info/warn/error (bootstrap y errorHandler)
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],

      // Preferencias de estilo no cubiertas por Prettier
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-duplicate-imports': 'error',
    },
  },

  // Tests: relajar retorno explícito y console
  {
    files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off',
    },
  },

  // Debe ir último: apaga reglas de formato que chocan con Prettier
  eslintConfigPrettier,
);
