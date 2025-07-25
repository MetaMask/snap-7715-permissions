module.exports = {
  extends: ['../../.eslintrc.js'],

  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['!.eslintrc.js'],
  rules: {
    // Disable jsdoc/tag-lines rule to allow lines after block descriptions
    'jsdoc/tag-lines': 'off',
  },
};
