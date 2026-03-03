const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      'node_modules/**',
      'coverage/**',
      '**/coverage/**',
      'docs/api/openapi.json',
      'src/api/generated/schema.ts',
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'supabase',
              message: 'Supabase imports are blocked. Use NestJS API wrappers only.',
            },
          ],
          patterns: [
            {
              group: ['@supabase/*'],
              message: 'Supabase imports are blocked. Use NestJS API wrappers only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/**/screens/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['TextInput', 'Button'],
              message:
                'Use shared UI kit components (AppInput/AppButton) instead of raw react-native controls in screens.',
            },
            {
              name: 'react-native-paper',
              importNames: ['TextInput', 'Button'],
              message:
                'Use shared UI kit components (AppInput/AppButton) instead of direct react-native-paper controls in screens.',
            },
          ],
        },
      ],
    },
  },
];
