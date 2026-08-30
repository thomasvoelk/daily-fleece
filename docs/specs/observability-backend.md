# Backend observability: OpenTelemetry + Observability-Driven Development

Instrumenting the daily-fleece Spring Boot backend with OpenTelemetry-native, wide-structured-event
observability, and defining what Observability-Driven Development (ODD) means for this project day
to day. Grounded in *Observability Engineering*, 2nd ed. (Majors, Fong-Jones, Miranda) — Part II
(Ch.5–7, instrumentation fundamentals) and Ch.9 (ODD), folding in Ch.8 (analysis methodology) and
Ch.10 (AI-agent use cases).

**Scope.** Backend only — frontend observability (RUM, error tracking) is deferred to a future,
separate map. Validated against a local, self-hosted stack; there is no Cloud Foundry access in
this environment, so production-deployment concerns are captured here as documentation only (see
[Cloud Foundry / production caveats](#cloud-foundry--production-caveats)). This is a learning
project — there is no real production traffic in *this* repo. The instrumentation approach and ODD
discipline below are written to be portable to the author's separate work fork, which does have real
CF traffic and daily users; the local validation stack (Tempo via Docker) stays daily-fleece-specific.

For the decision trail behind everything in this document, see the child tickets of df-9aoe
(Backend observability spec) — df-9aoe.1 through df-9aoe.4 — via `bd show df-9aoe`.

## Telemetry model

Wide structured events (Ch.5), not a traditional three-pillars split of separate logs, metrics, and
traces. Every unit of work — an HTTP request, a use case execution, a module-boundary call — emits
one event/span carrying arbitrarily many fields, queried after the fact rather than pre-aggregated
into dashboards decided in advance. Concretely this means OpenTelemetry spans are the primary
signal; SLF4J/Logback is kept only for infrastructure and startup noise that has no request or
domain context (JVM boot, framework warnings). Anything tied to a request or a domain flow —
including errors — lives on the span as attributes or an exception event, never as a duplicate log
line: maintaining two systems that record the same fact is pure liability.

Spring Boot 4's Micrometer Tracing bridge remains an option to revisit later if a reason to move off
wide events emerges; nothing today motivates it.

## Instrumentation mechanism

**`org.springframework.boot:spring-boot-starter-opentelemetry`** (GA 2025-11-20), version-locked to
the Spring Boot 4.1.0 parent already pinned in `backend/pom.xml` — no separate compatibility matrix
against Java 25 or Spring Boot 4.x to track. It bundles the OpenTelemetry API, the Micrometer
Tracing bridge, and OTLP exporters.

Rejected alternatives: the OpenTelemetry Java auto-instrumentation agent (`-javaagent`) had a
confirmed JDK 25 startup bug — [opentelemetry-java-instrumentation#13375](https://github.com/open-telemetry/opentelemetry-java-instrumentation/issues/13375),
opened 2025-02-21, fixed via #14953 in October 2025, about a month after Java 25 GA — illustrating
structural lag against new JDK majors that this stack's bleeding-edge versions (Java 25, Spring Boot
4.1) can't absorb quietly. The manual OpenTelemetry SDK just reimplements what the starter gets for
free, while the starter still exposes the underlying SDK beans (`OpenTelemetry`,
`SdkTracerProvider`, `ContextPropagators`) if raw access is ever genuinely needed. Full comparison:
`docs/research/otel-spring-boot-instrumentation.md` on the throwaway branch
`research/otel-spring-boot-instrumentation` (df-9aoe.1).

**Vocabulary lock:** instrument exclusively through the Micrometer **Observation API**
(`ObservationRegistry`, `@Observed`, `.lowCardinalityKeyValue()` / `.highCardinalityKeyValue()`,
`ObservationFilter`) — never the raw OpenTelemetry annotations/API (`@WithSpan`, `Span.current()`).
Two reasons: `spring-modulith-starter-insight` (already a dependency) produces its own
module-boundary spans through Micrometer, so mixing in raw OTel attributes would split one trace's
attributes across two vocabularies that only reconcile at the exporter; and `@Observed` needs no
javaagent — it's a pure Spring AOP proxy (`ObservedAspect`) that ships for free with the starter and
produces both a span and a metric from the same call.

## Local validation stack

**Grafana Tempo**, run locally via the single-container `grafana/otel-lgtm` image, wired into Spring
Boot's own Docker Compose lifecycle management (`backend/compose.observability.yml`, layered onto
`compose.local-dev.yml` via `spring.docker.compose.file` in `application-local-dev.properties`) so it
starts and stops alongside the backend and MongoDB — no separate `docker run` step:

```yaml
# backend/compose.observability.yml
services:
  otel-lgtm:
    image: grafana/otel-lgtm:0.32.0
    ports:
      - '${LOCAL_DEV_GRAFANA_PORT:-3000}:3000' # Grafana UI
      - '${LOCAL_DEV_OTLP_GRPC_PORT:-4317}:4317' # OTLP gRPC
      - '${LOCAL_DEV_OTLP_HTTP_PORT:-4318}:4318' # OTLP HTTP
      - '${LOCAL_DEV_TEMPO_PORT:-3200}:3200' # Tempo query API (TraceQL)
```

The multi-container docker-compose example is available if closer-to-prod fidelity is ever needed.

Tempo is the only local candidate that fully satisfies the wide-event query bar: **TraceQL** filters
on any span/resource attribute without pre-declared indexing (`{ span.session.id = "…" }`), and
TraceQL metrics adds `by()` grouping and aggregate functions (`count()`, `avg()`, `rate()`, …) on
arbitrary attributes. Jaeger's query API is exact-match-AND-only with no group-by or aggregation —
verified against `query_service.proto` — which structurally disqualifies it. SigNoz was a legitimate
second choice (Query Builder group-by on any ClickHouse-backed attribute) but its setup story just
moved to a new, undocumented-in-the-old-way "Foundry" CLI, and the stack is heavier (ClickHouse +
Keeper + Postgres + collector, ≥4 GB RAM). Honeycomb's free tier is the external reference UX only —
not usable here since it requires a cloud account, breaking the fully-local constraint. Full
comparison: `docs/research/local-observability-backend-comparison.md` on the throwaway branch
`research/local-observability-backend` (df-9aoe.2).

## Span and attribute model

Three tiers, all Micrometer `Observation`s landing in one trace:

1. **HTTP span** — auto-created by Spring MVC via the OTel starter. A global `ObservationFilter`
   bean (`RequestContextObservationFilter`, in `infrastructure.web`) runs on every `Observation`
   created anywhere (HTTP or not) and, when available, attaches `session.project_id` and
   `session.date` by reading the resolved Spring MVC path variables off the carrier request;
   sessions are natural-key-routed per [ADR-0016](../adr/0016-natural-key-routing-for-sessions.md),
   so these are literally in the URL. The filter no-ops gracefully for non-HTTP observations and
   for HTTP requests without those path variables (`/api/v1/players`, `/api/v1/leaderboard`, …).

   **Deviation from the original design (df-9aoe.3): `player.id` is not attached here.** The
   original design called for `player.id` from `SecurityContextHolder`'s `AuthenticatedPlayer`
   principal ([ADR-0019](../adr/0019-pluggable-authentication.md)) — but ADR-0019's auth stack
   (Spring Security, the `AuthenticatedPlayer` type) was never implemented; today player/host IDs
   arrive as request-body fields (`playerId`, `hostId`), resolved to a `UUID` inside each
   controller before it calls the use case, not as a path variable or a pre-populated security
   context available to a filter that runs before the body is parsed. Implemented instead: each
   use case that receives a caller `UUID` attaches its own `player.id` (tier 2, below) via
   `@ObservationKeyValue` on that parameter. This closes once ADR-0019 lands and a real
   `SecurityContextHolder` principal exists.

2. **Use-case span** — `@Observed` on each use case's execute method
   (`SubmitAnswerUseCase`, `SetCorrectAnswerUseCase`, `UpdateLeaderboardUseCase`, …), backed by
   `spring-boot-starter-aspectj` and `management.observations.annotations.enabled=true` (off by
   default in Spring Boot 4). Attributes are declared with Micrometer's `@ObservationKeyValue`
   annotation rather than hand-written code:
   - Inputs already available as method parameters — `session.id` (the internal `UUID`,
     [ADR-0010](../adr/0010-domain-value-types-and-shared-named-interface.md)), `player.id`,
     `voting.question` — are annotated directly on the parameter; the default behaviour
     (`toString()` of the argument) is enough for `UUID`/enum parameters.
   - Outcome attributes only knowable after execution (`session.phase` after
     `SetCorrectAnswerUseCase`/`StartSessionUseCase`; the created `session.id` for
     `CreateSessionUseCase`; the created `player.id` for `RegisterPlayerUseCase`) are declared on
     the method, evaluated against the return value. These use a small `ValueResolver` class
     (`SessionIdKeyValueResolver`, `SessionPhaseKeyValueResolver`, `PlayerIdKeyValueResolver`) per
     use-case package rather than a SpEL `expression` string: Micrometer's `ObservedAspect`
     evaluates method-result annotations unconditionally, including on the exception path where
     the result is `null` — a SpEL expression throws in that case (logged as noisy
     `AnnotationHandler` errors on every handled-exception request), whereas a resolver can just
     check `instanceof` and return `""` for a `null`/wrong-type argument.

3. **Module-boundary spans** — Spring Modulith's existing `spring-modulith-starter-insight`
   instrumentation ([ADR-0006](../adr/0006-spring-modulith-modules.md)), left untouched. Another
   layer in the same trace, already Micrometer-based.

**Attribute naming:** dotted lower-snake, OTel semantic-convention style (`session.id`,
`session.project_id`, `player.id`, `voting.question`, `session.phase`, …) to match the
auto-instrumented attributes already present on the same spans (`http.route`, `db.system`, …).
Identifiers (`session.id`, `player.id`) are high-cardinality (span-only, never a metric tag, since
`@Observed` also emits a `Timer` meter tagged with the low-cardinality key values); bounded values
(`session.project_id`, `voting.question`, `session.phase`) are low-cardinality. `session.date` is
high-cardinality despite being bounded per day, because it grows by one new value every day
indefinitely — unsuitable as an unbounded `Timer` tag.

Full design rationale, including why `@Observed` was chosen over `@WithSpan`:
resolution comment on df-9aoe.3. Implementation: df-9aoe.7.

## Error handling

`GlobalExceptionHandler` and `QuizExceptionHandler`
(`backend/src/main/java/de/dailyfleece/backend/infrastructure/web/GlobalExceptionHandler.java`,
`backend/src/main/java/de/dailyfleece/backend/quiz/infrastructure/web/QuizExceptionHandler.java`)
currently map exceptions to RFC 7807 `ProblemDetail` responses silently — no logging. Per the wide-
event model, they mark the current span as errored instead of logging:

- **HTTP-level span** — needs an explicit call, because Spring MVC's `ServerHttpObservationFilter`
  closes the HTTP observation *after* `@ExceptionHandler` has already turned the exception into a
  response — from the filter's point of view the request "succeeded". Fix, using Spring
  Framework's own documented mechanism, inside each `@ExceptionHandler` method:

  ```java
  ServerHttpObservationFilter.findObservationContext(request)
      .ifPresent(context -> context.setError(exception));
  ```

- **Use-case-level spans** — automatic. `ObservedAspect` (backing `@Observed`) already catches any
  thrown exception, calls `observation.error(throwable)`, and rethrows. No code needed.

- **Non-HTTP work** (message/event handlers, future cron jobs) — simpler than the HTTP case, not
  harder. Nothing auto-creates an observation to fight with, so the `@Observed` use-case span *is*
  the root span and `ObservedAspect`'s automatic `observation.error()` is sufficient by itself. Only
  one such handler exists today: `UpdateLeaderboardUseCase.on(SessionEndedDomainEvent)` — a
  synchronous (non-`@Async`) `@EventListener`, so it currently runs inline on the originating HTTP
  request's thread anyway.

## Trace-context propagation

Rely on the OTel starter's default W3C `traceparent` handling: it honors an incoming header if
present, otherwise starts a root span, with no code required. This is a minimal, deliberate choice —
no speculative correlation-ID exposure in responses for a frontend consumer that doesn't exist yet.
A future frontend observability map should plug into this W3C boundary as-is rather than expecting a
custom correlation-ID header.

**Known gap, not yet applicable:** Micrometer context and Spring Security's `SecurityContextHolder`
are both thread-local. If `UpdateLeaderboardUseCase`'s listener ever becomes `@Async`, or a real
message-queue consumer or `@Scheduled` job is added, a context-propagating `TaskDecorator` will need
wiring into the executor, or the child span loses its parent trace and the global `ObservationFilter`
loses `player.id`. Nothing async exists today, so this is not built — revisit if async work is
planned.

## Observability-Driven Development workflow

### Two-tier discipline

Ch.9's core mechanism is shipping instrumentation *with* a feature and closing the feedback loop
fast — canonically, paging the engineer who merged for 30–60 minutes post-deploy, forcing them to
answer: is the code doing what I expected? How does it compare to the previous version? Are users
using it? Are any abnormal conditions emerging? Daily-fleece has no on-call/paging infrastructure in
this repo, but the author runs a separate production fork with real daily users and real traffic
(not the CF apps this repo targets). That splits the discipline in two:

- **Local (this repo, synthetic traffic).** After implementing or changing a use case, exercise it
  via a single targeted e2e test or a manual curl/HTTPie hit against the locally-running backend +
  Tempo stack — not the full e2e suite, not a dedicated traffic generator (see
  df-9aoe.4 — a dedicated generator was considered and ruled out of scope: the local
  Playwright suite ([ADR-0009](../adr/0009-playwright-acceptance-accessibility.md)) plus manual/curl
  traffic already covers "generate a trace to look at" for a single-developer local loop). Answer
  the four questions above against the resulting trace as an explicit habit before calling the work
  done.
- **Production (work fork, real users).** The book's literal mechanic applies more directly:
  self-impose "check the trace of what I just shipped shortly after it goes live," even without
  formal paging, since the author is the only one who'd catch a regression anyway.

### Relationship to existing tests

This complements, not replaces, TDD/unit/e2e tests. Tests lock in known invariants (known-unknowns);
the trace-reading loop is exploratory — for behavior tests don't assert, and for visibility into
cross-module Spring Modulith flows that a single test can't see end-to-end.

### How to read a trace: the core analysis loop (Ch.8)

1. State what you're trying to understand.
2. Visualize the trace/span data to find the anomalous area.
3. Diff dimensions between that area and a baseline via TraceQL.
4. Iterate until you know enough.

Grafana Tempo has no Honeycomb-BubbleUp-style automated dimension-diffing, so this stays a manual
technique. At daily-fleece's traffic volume that's sufficient, not a gap worth automating.

### Instrumentation rules (standing agent-configuration block)

The span/attribute model above is fixed project-wide. Ch.7's "planning mode" — deciding what to
instrument — is therefore pre-resolved; day-to-day work is "execution mode" against fixed rules.
Claude Code (or any contributor) should load this block before instrumenting a new use case rather
than re-deriving the model from prose each time:

> - OpenTelemetry spans are our primary signal. Logging is reserved for infra/startup noise outside
>   request scope — never duplicate a fact that's already an attribute on a span.
> - Instrument exclusively through the Micrometer Observation API (`@Observed`,
>   `@ObservationKeyValue`, `ObservationFilter`). Never the raw OpenTelemetry API (`@WithSpan`,
>   `Span.current()`).
> - Every use-case span must carry `session.id` and outcome attributes (voting phase, computed
>   scores) — via `@ObservationKeyValue` on the use case's execute method/parameters. Use a
>   `ValueResolver` (not a SpEL `expression`) for anything evaluated against the method's return
>   value, since `ObservedAspect` evaluates result annotations even on the exception path
>   (result is `null`) and a SpEL expression throws there.
> - `session.project_id` and `session.date` are attached globally by the `ObservationFilter` — do
>   not re-attach them per use case. `player.id` is **not** global (no `SecurityContextHolder`
>   principal exists yet — ADR-0019 isn't implemented): attach it per use case via
>   `@ObservationKeyValue` on whatever parameter carries the caller's `UUID`.
> - Attribute names are dotted lower-snake, OTel semantic-convention style
>   (`session.id`, `voting.question`, `session.phase`, …) — match existing auto-instrumented
>   attributes (`http.route`, `db.system`). Identifiers are high-cardinality; bounded values
>   (enums, the project ID) are low-cardinality — low-cardinality values also become `Timer`
>   meter tags, so never mark an unboundedly-growing value (like `session.date`) low-cardinality.
> - On error: HTTP-level handlers call `ServerHttpObservationFilter.findObservationContext(request)
>   .ifPresent(context -> context.setError(exception))` explicitly; use-case and non-HTTP spans mark
>   errors automatically via `ObservedAspect` — no extra code needed there.

### Agent posture and context

Claude Code operates as the book's "commander" example (Ch.10) — goal-directed, deciding what to
query and how to instrument, with less step-by-step oversight than a copilot. This is trustworthy
here because daily-fleece's operational context is small and already written down:
`docs/domain-model.md`, the ADRs referenced throughout this spec, and the instrumentation rules
above. Point Claude Code at these before a trace-analysis or instrumentation session rather than
starting cold. The human sense-making decision — does this trace mean the feature is right — stays
with a person, per Ch.9.

## Cloud Foundry / production caveats

No Cloud Foundry access exists in this environment, so the following are documentation only, not
validated here:

- OTLP export endpoint configuration (`management.opentelemetry.tracing.export.otlp.endpoint`) will
  need to point at whatever backend the CF deployment (or the author's work fork) uses instead of
  the local `grafana/otel-lgtm` container.
- Sampling (`management.tracing.sampling.probability`) is set to `1.0` in
  `application-local-dev.properties` — Spring Boot's default of `0.1` would make the ODD workflow's
  single manual/e2e hit (see below) unreliable, since 9 in 10 such requests would go untraced. A
  production deployment with real traffic volume should override this and set sampling deliberately
  rather than trace every request.
- This spec's instrumentation approach and vocabulary (Micrometer Observation API, the three-tier
  span model, the ODD workflow) are written to be portable to the author's production work fork,
  which does have real CF traffic — only the local validation stack (Tempo via Docker) is
  daily-fleece-specific and doesn't need to travel.

## References

- ADRs: [0006](../adr/0006-spring-modulith-modules.md) (Modulith module boundary),
  [0009](../adr/0009-playwright-acceptance-accessibility.md) (Playwright as local traffic source),
  [0010](../adr/0010-domain-value-types-and-shared-named-interface.md) (domain value types),
  [0016](../adr/0016-natural-key-routing-for-sessions.md) (natural-key session routing),
  [0019](../adr/0019-pluggable-authentication.md) (`AuthenticatedPlayer` principal)
- Research: `docs/research/otel-spring-boot-instrumentation.md` (branch
  `research/otel-spring-boot-instrumentation`), `docs/research/local-observability-backend-comparison.md`
  (branch `research/local-observability-backend`)
- Wayfinder map: df-9aoe (Backend observability spec), decision tickets df-9aoe.1–df-9aoe.4
- Remaining implementation tickets on the same map: df-9aoe.6 (add OTel starter dependency and local
  Tempo stack), df-9aoe.7 (implement the three-tier `@Observed` instrumentation), df-9aoe.8
  (validate the local ODD loop end-to-end)
