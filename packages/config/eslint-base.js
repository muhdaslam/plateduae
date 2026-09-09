// Shared base ESLint flat config for all TypeScript workspaces.
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(tseslint.configs.recommended, {
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
});
