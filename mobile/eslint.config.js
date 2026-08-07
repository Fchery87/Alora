// ESLint flat config for Expo SDK 54 + TypeScript.
// Extends the Expo preset and adds Prettier formatting.
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier");
const eslintPluginPrettier = require("eslint-plugin-prettier");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/", ".expo/", "dist/", "coverage/"],
  },
  // Turn off rules that conflict with Prettier, then enable the formatter check.
  prettierConfig,
  {
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      "prettier/prettier": "warn",
      "import/order": "off", // defer to Prettier
    },
  },
  // PowerSync modules are intentionally optional (see powersync.d.ts) —
  // they are installed only when the backend is provisioned. The import
  // resolver flags them as unresolved by design.
  {
    files: ["powersync/**", "data/supabaseRepository.ts", "lib/useAuth.tsx"],
    rules: {
      "import/no-unresolved": "off",
    },
  },
  // Node test files (run via `node --test`) — not part of the app bundle.
  {
    files: ["__tests__/**"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
        process: "readonly",
      },
    },
  },
];
