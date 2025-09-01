import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ['**/*.{js,mjs,cjs,ts}'],
  ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
});