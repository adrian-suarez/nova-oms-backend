import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {ignores: ["dist/**", "node_modules/**", "cdk.out/**","coverage/**", "scripts/dev-tools/**"]},
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["src/**/*.ts","infra/**/*.ts", "prisma.config.ts", "prisma/seed.ts","prisma/seeds/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: globals.node,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "no-unused-vars": "off",
      "no-redeclare": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" ,  varsIgnorePattern: "^_"}],
      "@typescript-eslint/no-redeclare": "error",
    },
  },

  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.node,
        describe:"readonly",
        it:"readonly",
        expect:"readonly",
        vi:"readonly",
        beforeEach:"readonly",
        afterEach:"readonly",
        beforeAll:"readonly",
        afterAll:"readonly",

      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "no-unused-vars": "off",
      "no-redeclare": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" ,  varsIgnorePattern: "^_"}],
      "@typescript-eslint/no-redeclare": "error",
    },
  },
];
