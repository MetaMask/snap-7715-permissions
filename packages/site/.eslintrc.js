module.exports = {
  extends: ['../../.eslintrc.js'],

  parserOptions: {
    tsconfigRootDir: __dirname,
  },

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['@metamask/eslint-config-browser'],
      rules: {
        'no-restricted-globals': 'off',
        // Disable jsdoc/tag-lines rule to allow lines after block descriptions
        'jsdoc/tag-lines': 'off',
      },
    },
  ],

  ignorePatterns: ['.cache/', 'public/'],
};
