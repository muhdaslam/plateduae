const baseConfig = require("@plated/config/eslint-base");
const moduleBoundaries = require("@plated/config/eslint-module-boundaries");

module.exports = [
  { ignores: ["dist/**"] },
  ...baseConfig,
  {
    languageOptions: {
      globals: { process: "readonly", require: "readonly", module: "readonly", __dirname: "readonly" },
    },
  },
  {
    files: ["src/modules/**/*.ts"],
    ...moduleBoundaries,
  },
];
