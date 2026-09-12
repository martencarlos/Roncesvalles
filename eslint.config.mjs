import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Kept as warnings (not errors) so newer patterns surface without
      // blocking builds. The existing violations were migrated away; future
      // occurrences should be fixed rather than accumulated.
      "@typescript-eslint/no-explicit-any": "warn",
      // react-hooks v6 (React Compiler) rules ship stricter upstream; keep
      // them advisory here.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".delta/**",
  ]),
]);

export default eslintConfig;
