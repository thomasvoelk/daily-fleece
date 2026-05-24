# Monorepo with three top-level directories

The project uses a single Git repository with three top-level directories: `api/`, `backend/`, and `frontend/`. We chose a monorepo because the OpenAPI spec needs to live on neutral ground — owned by neither the backend nor the frontend — and cross-cutting changes (e.g. adding a new API endpoint and consuming it in Angular) can land in a single PR. The main trade-off is that our existing GitHub Actions workflows are tailored to one artifact per repo; we'll use path filters (`on: push: paths:`) to trigger separate deployment jobs from within the same repo.

## Considered Options

Separate repositories (one per artifact) were ruled out because they would force the OpenAPI spec to live inside the backend repo, implicitly coupling the contract to the backend.
