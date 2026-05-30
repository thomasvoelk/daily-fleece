# URL path versioning with Spring Framework 7 ApiVersionConfigurer

The conventional `/api/v1` prefix is kept in the URL. URL path versioning is the
industry-standard approach for multi-client APIs (used by Facebook, Twitter, Airbnb)
— it is discoverable in browser address bars, visible in server logs, and works
unchanged with OpenAPI tooling and code generators.

Spring Framework 7's `ApiVersionConfigurer` with `usePathSegment()` is layered on top:
it makes the version segment active rather than a passive string, adding version
validation (unknown versions → 400), `1.0+` baseline ranges (one controller method
covers all compatible minor versions), and RFC-compliant deprecation headers when a
version is retired.

Semantic versioning (`SemanticApiVersionParser`, the default) is used. The parser
strips leading non-digit characters, so the conventional `v1` prefix in the URL is
parsed as `1.0.0` — no custom parser needed. Minor and patch components default to 0,
so `/api/v1` is equivalent to `/api/1.0.0`.

**Alternatives rejected:**

- **Header versioning (`API-Version: 1.0`)** — philosophically correct (URL identifies
  the resource, not the representation), but the industry's multi-client reference cases
  all chose URL versioning for discoverability and debuggability. Browser testing and
  log inspection are noticeably harder with header-based versions.
- **Media type versioning (`Accept: application/vnd.dailyfleece.v1+json`)** — most
  RESTfully correct, but poor OpenAPI tooling support and hard to test.

**Consequences:**

- `WebMvcConfig` configures `configurer.usePathSegment(index)` where `index` is the
  position of the version segment in `/api/{version}/...`.
- Controller class-level `@RequestMapping` carries `version = "1.0+"` so all methods
  in the class are covered by one annotation.
- `openapi.yaml` servers block reflects the versioned base path; when v2 is needed a
  second spec is added and both generators run twice into separate packages/output folders.
- Unsupported versions (e.g. `/api/v2/...` when only v1 is registered) are rejected
  by Spring with 400. Missing versions (e.g. `/api/sessions/today`) return 404 because
  the URL never matches any handler pattern — Spring's version error only fires after a
  handler is found, which requires the version segment to be present.
