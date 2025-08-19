module.exports = {
  extends: ['../../.eslintrc.js'],

  parserOptions: {
    tsconfigRootDir: __dirname,
  },

  overrides: [
    {
      files: ['snap.config.ts'],
      extends: ['@metamask/eslint-config-nodejs'],
    },

    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        // This allows importing the `Text` JSX component.
        '@typescript-eslint/no-shadow': [
          'error',
          {
            allow: ['Text'],
          },
        ],
        // Disable jsdoc/tag-lines rule to allow lines after block descriptions
        'jsdoc/tag-lines': 'off',
        // Allow throwing Snap SDK error objects
        '@typescript-eslint/no-throw-literal': 'off',
      },
    },

    {
      files: ['*.test.ts', '*.test.tsx'],
      rules: {
        '@typescript-eslint/unbound-method': 'off',
      },
    },
  ],

  ignorePatterns: [
    '**/snap.manifest.json',
    '!.eslintrc.js',
    'dist/',
    'scripts/update-manifest-local.js',
  ],
};
