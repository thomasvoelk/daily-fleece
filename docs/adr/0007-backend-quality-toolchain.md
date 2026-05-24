# Backend quality toolchain: Spring Modulith tests, ArchUnit, NullAway/JSpecify, TDD

The backend enforces code quality through four complementary tools that together prevent an entire class of bugs and architectural drift from ever reaching review.

**Spring Modulith `@ApplicationModuleTest`** — each Spring Modulith module (`quiz`, `player`) has focused integration tests using `@ApplicationModuleTest`. This boots only the relevant slice of the application context, keeping tests fast and module boundaries visible.

**ArchUnit with onion architecture** — ArchUnit enforces the onion (hexagonal) layering at compile time. Domain code cannot import infrastructure; infrastructure cannot leak into the domain. Violations fail the build.

**NullAway + JSpecify** — every package has a `package-info.java` annotated with `@NullMarked` (see [Spring blog: Null Safety in Spring Apps](https://spring.io/blog/2025/03/10/null-safety-in-spring-apps-with-jspecify-and-null-away)). This makes non-null the default for all types in the package. NullAway enforces this at compile time via the Error Prone compiler plugin. Nullable values must be explicitly annotated with `@Nullable`. The goal is to eliminate NullPointerExceptions by construction rather than by convention.

**Strict TDD** — no production code is written without a failing test first. Red → Green → Refactor. This is a process constraint, not a tool constraint, but it is non-negotiable for this project.
