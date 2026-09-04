import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Pre-existing patterns in this codebase (46 `catch (err: any)`, mongoose
      // query objects); typing them all is a dedicated migration. Visible as
      // warnings until then.
      "@typescript-eslint/no-explicit-any": "warn",
      // New react-hooks v6 (React Compiler) rules shipped as errors in
      // eslint-config-next 16; flagging 17 sites that work today. Adopt
      // gradually and tighten back to "error".
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
