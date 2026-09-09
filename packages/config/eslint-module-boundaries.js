// Enforces the "modular monolith, extractable modules" decision from the
// architecture doc (section 6): a module under apps/api/src/modules/<name>
// may only be imported from outside via its index.ts barrel. Deep imports
// like `modules/catalogue/catalogue.service` from another module are
// forbidden by lint, not just convention, so extraction later stays cheap.
//
// Flat-config object — spread into an app's eslint.config.cjs, scoped to
// the files that actually live under src/modules (see apps/api's config).
const boundaries = require("eslint-plugin-boundaries");

module.exports = {
  plugins: { boundaries },
  settings: {
    // Without a resolver that understands extension-less TS imports
    // (`../search/search.service` -> `search.service.ts`), the plugin
    // can't classify what a relative import points at, and every
    // boundaries rule below silently no-ops instead of erroring — this
    // resolver is load-bearing, not optional. See eslint-plugin-boundaries'
    // README "Resolvers" section.
    "import/resolver": {
      typescript: {},
    },
    "boundaries/elements": [
      { type: "module", pattern: "src/modules/*", mode: "folder" },
      { type: "common", pattern: "src/common/*", mode: "folder" },
      { type: "config", pattern: "src/config/*", mode: "folder" },
    ],
  },
  rules: {
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          // Any module may use common/ and config/ freely.
          { from: "module", allow: ["common", "config"] },
          { from: "common", allow: ["common", "config"] },
          // A module may depend on another module at all (this rule only
          // governs which element *types* can depend on which); whether
          // that import must go through index.ts is enforced separately
          // below by boundaries/entry-point.
          { from: "module", allow: ["module"] },
        ],
      },
    ],
    "boundaries/entry-point": [
      "error",
      {
        default: "disallow",
        rules: [{ target: "module", allow: "index.ts" }],
      },
    ],
  },
};
