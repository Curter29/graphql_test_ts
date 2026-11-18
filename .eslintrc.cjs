module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: ['.mesh/', 'dist/', 'tmp/'],
  rules: {
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
  },
};
