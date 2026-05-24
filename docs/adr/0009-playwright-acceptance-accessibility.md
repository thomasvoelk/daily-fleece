# Playwright for acceptance testing and accessibility testing

Playwright is used for two distinct purposes that span both frontend and backend:

**Acceptance testing** — end-to-end scenarios that verify complete user journeys work as specified (e.g. host uploads photos, starts session, players answer, leaderboard updates). These tests run against a real stack and are the final automated gate before a feature is considered done. They are optional in the sense that not every task requires one, but any use case from REQUIREMENTS.md should eventually have coverage.

**Accessibility testing** — Playwright's accessibility snapshot and axe-core integration are used to verify that the mobile-first UI meets accessibility standards. This is not a separate phase; accessibility checks run alongside the acceptance tests.

Playwright was chosen over Cypress because of its superior mobile viewport simulation (relevant given the mobile-first requirement) and native multi-browser support.
