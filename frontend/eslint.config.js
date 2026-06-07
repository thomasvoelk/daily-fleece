// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const sheriff = require("@softarc/eslint-plugin-sheriff");
const rxjsx = require("eslint-plugin-rxjs-x").default;
const tailwind = require("eslint-plugin-tailwindcss");
const sonarjs = require("eslint-plugin-sonarjs");
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
      sonarjs.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [],
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
      // Additional @angular-eslint rules (df-jef.4)
      "@angular-eslint/no-conflicting-lifecycle": "error",
      "@angular-eslint/consistent-component-styles": "error",
      // component-class-suffix omitted: project uses suffix-free page components (App, Lobby, Quiz…)
      "@angular-eslint/directive-class-suffix": "error",
      "@angular-eslint/computed-must-return": "error",
      "@angular-eslint/no-attribute-decorator": "error",
      "@angular-eslint/no-lifecycle-call": "error",
      "@angular-eslint/no-duplicates-in-metadata-arrays": "error",
      "@angular-eslint/use-injectable-provided-in": "error",
      "@angular-eslint/relative-url-prefix": "error",
      "@angular-eslint/prefer-output-readonly": "error",
      "@angular-eslint/no-input-prefix": "error",
      "@angular-eslint/no-forward-ref": "error",
      "@angular-eslint/use-component-selector": "error",
      "@angular-eslint/contextual-decorator": "error",
      "@angular-eslint/no-queries-metadata-property": "error",
      "@angular-eslint/pipe-prefix": ["error", { prefixes: ["app"] }],
      // sonarjs overrides
      "sonarjs/function-return-type": "off", // CanActivateFn legitimately returns boolean | UrlTree
    },
  },
  {
    // Test stubs are anonymous route components — they need no selector
    files: ["**/*.spec.ts"],
    rules: {
      "@angular-eslint/use-component-selector": "off",
      "@angular-eslint/prefer-on-push-component-change-detection": "off",
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
        whitelist: ["duration-fast", "duration-base", "duration-slow"],
      },
    },
    rules: {
      "tailwindcss/classnames-order": "error",
      "tailwindcss/enforces-negative-arbitrary-values": "error",
      "tailwindcss/enforces-shorthand": "error",
      "tailwindcss/no-contradicting-classname": "error",
      "tailwindcss/no-custom-classname": ["error", { whitelist: [".*duration-(fast|base|slow)", "material-symbols-rounded", "^peer$"] }],
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
            "scope",      // HTML table attribute (col/row enum, not user-facing text)
            "variant",    // ChunkyButton enum input, not user-facing text
            "color",      // ChunkyButton enum input, not user-facing text
          ],
        },
      ],
    },
  },
]);
