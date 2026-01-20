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
      '**/node_modules/',
      '**/dist*/',
      '**/*__GENERATED__*',
      '**/build/',
      '**/public/',
      '**/.cache/',
      '**/coverage/',
      '**/.packages-cache/',
      '**/eslint.config.mjs',
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
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    extends: typescript,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
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
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js'],
    extends: jest,
    rules: {
      '@typescript-eslint/no-shadow': [
        'error',
        {
          allow: ['describe', 'expect', 'it', 'jest', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll'],
          builtinGlobals: true,
        },
      ],
      'jsdoc/tag-lines': 'off',
    },
  },
]);

export default config;

