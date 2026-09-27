import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/', 'legacy/', 'reference/', '.claude/', '.agents/', '.playwright*/']),
  js.configs.recommended,
  tseslint.configs.recommended,
  { languageOptions: { globals: globals.browser } },
  prettier,
]);
