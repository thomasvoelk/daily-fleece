# Natural-key routing for Session resources

Sessions are addressed in the API by their natural key — `{projectId}/{date}` (e.g.
`/sessions/default/2026-06-10`) — rather than by UUID. All session sub-resources
(`/join`, `/results`, etc.) use the same natural key.

The natural key is already unique and stable: at most one Session exists per Project
per calendar date, and that constraint is enforced at the domain level. Exposing the
natural key lets any client construct the URL for today's session without a prior
lookup, eliminating the `GET /sessions/today` round-trip. The frontend knows today's
date (browser clock, same timezone as server) and hardcodes the project ID (`"default"`
until multi-project support is added).

The old `GET/POST/DELETE /sessions/today` routes and UUID-routed sub-resources are
removed incrementally: the natural-key routes are added first, the frontend is migrated
call-site by call-site, then the legacy routes are dropped.

**Alternatives rejected:**

- **Keep `GET /sessions/today`** — `today` encodes a temporal assumption (server
  timezone defines "today") and forces an extra round-trip for any client that only
  knows the date. Moving that decision to the client is more flexible and removes
  hidden server-side state.
- **Query parameters (`/sessions?project=default&date=2026-06-10`)** — valid REST but
  less cacheable and harder to use as a base path for sub-resources.

**Constraints:**

- "Today" is the browser's local date. All browsers and the server share the same
  timezone — if this changes, the routing assumption breaks.
- `projectId` is hardcoded to `"default"` in the frontend until multi-project support
  is implemented.
