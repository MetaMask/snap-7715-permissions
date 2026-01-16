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
    ignores: ['coverage/', 'eslint.config.mjs'],
  },

  {
    extends: base,
  },

  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
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
      '@typescript-eslint/no-shadow': [
        'error',
        {
          allow: ['describe', 'expect', 'it', 'jest', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll'],
          builtinGlobals: true,
        },
      ],
    },
  },
]);

export default config;
