// eslint.config.ts

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

// 这是一个基本的忽略模式，用于排除构建目录等
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = path.resolve(__dirname);

export default [
  // 1. 全局忽略文件 (等同于 .gitignore 的作用)
  {
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/temp/**',
      '**/.cache/**',
      '**/.output/**',
      '**/.nuxt/**',
      '**/.vuepress/**',
      '**/.vitepress/**',
    ],
  },
  // 2. Vue 插件推荐规则
  {
    files: ['**/*.vue'],
    ...vue.configs['flat/essential'],
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // 3. TypeScript 文件配置
  {
    files: ['**/*.ts', '**/*.mts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: [
          path.resolve(projectRoot, 'tsconfig.app.json'),
          path.resolve(projectRoot, 'tsconfig.node.json'),
        ],
        tsconfigRootDir: projectRoot,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  // 4. 通用规则
  {
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
      'vue/no-v-html': 'off',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },
  // 5. Prettier 规则
  prettier,
];
