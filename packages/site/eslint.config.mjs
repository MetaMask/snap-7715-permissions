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
    ignores: ['.cache/', 'public/', 'dist/', 'coverage/', 'eslint.config.mjs'],
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
      'no-restricted-globals': 'off',
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
      // Disable strict return type requirement for styled-components and React
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Allow styled-components default import pattern
      'import-x/no-named-as-default': 'off',
      // Allow shadowing of chainId variable
      '@typescript-eslint/no-shadow': 'off',
      // Allow short identifier names
      'id-length': 'off',
      // Allow parseInt without radix (default is 10)
      'radix': 'off',
      // Allow nullish coalescing or logical or
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // Allow promise-returning functions in event handlers
      '@typescript-eslint/no-misused-promises': 'off',
      // Allow promise chains without explicit return
      'promise/always-return': 'off',
      // Allow custom promise parameter names
      'promise/param-names': 'off',
      // Allow unbound methods
      '@typescript-eslint/unbound-method': 'off',
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

