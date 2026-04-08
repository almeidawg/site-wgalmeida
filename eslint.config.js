import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-*/**',
      'coverage/**',
      '.next/**',
      '.vercel/**',
      'site-wglmeida-blog-imagens/**',
      'screenshots/**',
      'video-sitemap.xml/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  {
    files: [
      'src/**/*.{js,jsx}',
      'api/**/*.js',
      '*.js',
      '*.mjs',
      '*.cjs',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...globals.vitest,
      },
    },
    plugins: {
      react: reactPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];
