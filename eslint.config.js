// @ts-check

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-plugin-prettier/recommended');

module.exports = tseslint.config(
  {
    ignores: [
      '**/coverage',
      '**/dist',
      '**/node_modules',
      '**/.angular',
      '**/**.min.js',
      '**/.yarn',
      '**/scripts/build/**.js',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',
      '@angular-eslint/service-class-suffix': 'off',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'fts',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: ['attribute'],
          prefix: 'fts',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
      'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      'max-len': [
        'error',
        {
          code: 100,
          ignoreComments: true,
          ignoreRegExpLiterals: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreTrailingComments: true,
          ignoreUrls: true,
        },
      ],
      'max-lines': [
        'error',
        {
          max: 260,
          skipBlankLines: true,
          skipComments: false,
        },
      ],
      'no-console': ['error'],
      'no-eval': 'error',
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: '*', next: ['if', 'for', 'while', 'switch'] },
        { blankLine: 'always', prev: ['if', 'for', 'while', 'switch'], next: '*' },
      ],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'max-lines': 'off',
      '@angular-eslint/component-selector': 'off',
      '@angular-eslint/directive-selector': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@angular-eslint/template/click-events-have-key-events': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'off',
      'padding-line-between-statements': 'off',
      'no-console': 'off',
      'no-eval': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      'prettier/prettier': [
        'error',
        {
          parser: 'angular',
        },
      ],
    },
  },
  // @ts-ignore
  prettier,
);
