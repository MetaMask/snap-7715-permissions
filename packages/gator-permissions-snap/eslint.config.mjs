// @ts-check

import base, { createConfig } from '@metamask/eslint-config';
import jest from '@metamask/eslint-config-jest';
import nodejs from '@metamask/eslint-config-nodejs';
import typescript from '@metamask/eslint-config-typescript';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = createConfig([
  {
    ignores: [
      'dist/',
      'coverage/',
      'snap.manifest.json',
      'scripts/update-manifest-local.js',
      'eslint.config.mjs',
    ],
  },

  {
    extends: base,
  },

  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    extends: nodejs,
  },

  {
    files: ['snap.config.ts'],
    extends: nodejs,
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: typescript,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // This allows importing the `Text` JSX component.
      '@typescript-eslint/no-shadow': [
        'error',
        {
          allow: ['Text'],
          builtinGlobals: true,
        },
      ],
      // Allow throwing Snap SDK error objects
      '@typescript-eslint/only-throw-error': 'off',
      // Disable jsdoc/tag-lines rule to allow lines after block descriptions
      'jsdoc/tag-lines': 'off',
      // Relax JSDoc requirements - only require on functions/classes, not types/properties
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            ArrowFunctionExpression: false,
            ClassDeclaration: true,
            FunctionDeclaration: true,
            FunctionExpression: false,
            MethodDefinition: false,
          },
          contexts: [],
        },
      ],
    },
  },

  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    extends: jest,
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      'jest/unbound-method': 'off',
      '@typescript-eslint/no-shadow': [
        'error',
        {
          allow: ['describe', 'expect', 'it', 'jest', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll', 'Text'],
          builtinGlobals: true,
        },
      ],
      // Allow empty arrow functions in mocks
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      // Allow .resolves/.rejects patterns
      'jest/no-restricted-matchers': 'off',
    },
  },
]);

export default config;
