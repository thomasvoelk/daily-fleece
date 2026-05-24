# Frontend quality toolchain: ESLint strict, Sheriff, Testing Library

The frontend enforces the same discipline as the backend through three tools.

**ESLint strictest configuration** — the Angular project is initialized with the strictest available ESLint ruleset. No exceptions are added without explicit justification.

**Sheriff (`@softarc/sheriff`)** — Sheriff enforces module boundaries in the Angular codebase the same way ArchUnit does in the backend. Features are organized into domains; inter-domain imports are declared explicitly and enforced at build time. Undeclared cross-domain imports fail the linter.

**Testing Library** — all component tests use `@testing-library/angular`. The guiding philosophy is: *"The more your tests resemble the way your software is used, the more confidence they can give you."* This means tests interact with the DOM the way a user would — by accessible role, label, or text — not by CSS class or component internals. Query priority follows the official Testing Library hierarchy: accessible queries first (ByRole, ByLabelText, ByPlaceholderText), semantic queries second (ByText, ByDisplayValue), test-id queries last and only when no semantic alternative exists. See: https://testing-library.com/docs/queries/about/#priority
