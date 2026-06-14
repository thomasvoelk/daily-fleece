# Pluggable authentication via conditional SecurityFilterChain

The app needs to run with a simple stub locally and swap in a company SSO mechanism
in the forked company repository — without changing any existing code in the private
repo. We introduce Spring Security with a single plug point: a `SecurityFilterChain`
bean that populates an `AuthenticatedPlayer(UUID playerId)` principal into the
`SecurityContext`. The stub chain is annotated `@ConditionalOnMissingBean(SecurityFilterChain.class)`;
the company fork silences it by providing its own bean. Everything downstream —
controllers resolving `@AuthenticationPrincipal AuthenticatedPlayer`, use cases
receiving plain `UUID` — is identical in both repos.

**Stub mechanism:** A single `POST /auth/login` endpoint (replacing the former
`POST /api/v1/players`) accepts CompanyId + DisplayName, upserts the Player record,
and creates a server-side session. Spring Security issues a session cookie; the
Angular frontend carries it automatically on all subsequent requests. No JWT, no
separate registration step.

**Company fork:** Adds one `@Configuration` class providing a `SecurityFilterChain`
that validates whatever the internal DATEV Angular library sends (Bearer token,
header, cookie — not yet known). The stub chain never activates.

**Alternatives rejected:**

- **JWT for stub** — minting and validating tokens locally requires a secret key,
  an encoder, and a dedicated token endpoint. Session cookies are simpler and the
  stub is only for local development.
- **HTTP Basic Auth** — requires a login form or browser credential dialog; neither
  fits a SPA with a separate frontend origin.
- **Spring form login** — designed for server-rendered apps; breaks for Angular SPAs
  making API calls (redirects HTML into fetch responses).
- **BFF pattern (backend holds DATEV tokens, frontend gets session cookie)** — required
  for public third-party DATEV integrations due to CORS restrictions at login.datev.de.
  Not applicable here: an internal DATEV Angular library handles auth on the frontend
  and the session is managed outside this backend.
- **Spring profile switching** — profiles require the private repo to contain both
  stub and SSO code. `@ConditionalOnMissingBean` lets the company fork add SSO without
  touching the private repo at all.

**Consequences:**

- `POST /api/v1/players` is removed; the OpenAPI spec changes accordingly.
- Request body fields `hostId` / `playerId` are removed from all endpoints; controllers
  switch to `@AuthenticationPrincipal`.
- The e2e helper `clearSession()` makes an unauthenticated `DELETE` call; it will need
  a stub login step (or the delete endpoint stays open in the stub profile) once auth
  is enforced.
- The company fork must know what `AuthenticatedPlayer` is — it lives in shared
  infrastructure and is the only type the SSO chain needs to produce.
