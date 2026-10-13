import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist/", "coverage/", "node_modules/"] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }
            ]
        }
    },
    {
        files: ["**/*.js", "**/*.mjs"],
        languageOptions: {
            sourceType: "commonjs",
            globals: {
                require: "readonly",
                module: "writable",
                process: "readonly",
                console: "readonly",
                __dirname: "readonly",
                globalThis: "readonly"
            }
        },
        rules: { "@typescript-eslint/no-require-imports": "off" }
    },
    {
        files: ["__tests__/**"],
        rules: { "@typescript-eslint/no-require-imports": "off" }
    },
    {
        files: ["eslint.config.mjs"],
        languageOptions: { sourceType: "module" }
    }
);
