// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const sheriff = require("@softarc/eslint-plugin-sheriff");
const rxjsx = require("eslint-plugin-rxjs-x").default;
const tailwind = require("eslint-plugin-tailwindcss");
const path = require("path");

module.exports = defineConfig([
  {
    ignores: ["src/app/backend-client/**", "src/index.html"],
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
      sheriff.configs.all,
      rxjsx.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["src/app/shared/testing/*.ts"],
        },
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      "rxjs-x/no-floating-observables": "error",
      "@angular-eslint/no-uncalled-signals": "error",
      "@angular-eslint/no-pipe-impure": "error",
      "@angular-eslint/prefer-signals": "error",
      "@angular-eslint/no-async-lifecycle-method": "error",
      "@angular-eslint/no-implicit-take-until-destroyed": "error",
      "@angular-eslint/prefer-on-push-component-change-detection": "error",
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@typescript-eslint/no-extraneous-class": ["error", { allowWithDecorator: true }],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    plugins: { tailwindcss: tailwind },
    settings: {
      tailwindcss: {
        cssConfigPath: path.resolve(__dirname, "src/styles.css"),
      },
    },
    rules: {
      "tailwindcss/classnames-order": "error",
      "tailwindcss/enforces-negative-arbitrary-values": "error",
      "tailwindcss/enforces-shorthand": "error",
      "tailwindcss/no-contradicting-classname": "error",
      "tailwindcss/no-custom-classname": "error",
      "tailwindcss/no-unnecessary-arbitrary-value": "error",
      "@angular-eslint/template/prefer-self-closing-tags": "error",
      "@angular-eslint/template/no-empty-control-flow": "error",
      "@angular-eslint/template/use-track-by-function": "error",
      "@angular-eslint/template/button-has-type": "error",
      "@angular-eslint/template/i18n": [
        "error",
        {
          checkId: true,
          checkText: true,
          checkAttributes: true,
          ignoreAttributes: [
            "appearance", // Material Design tokens, not user-facing text
            "accept",     // MIME types on file inputs
            "aria-live",  // ARIA token values (assertive, polite)
          ],
        },
      ],
    },
  },
]);
