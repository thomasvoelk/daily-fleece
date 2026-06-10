# JaCoCo branch coverage gate at 80%

The backend enforces a minimum **80% branch coverage** threshold via JaCoCo, failing `mvn verify` if the threshold is not met. Generated OpenAPI sources (`de/dailyfleece/api/**`) are excluded from the check because they are not hand-written code.

**Branch over instruction.** Branch coverage was chosen over instruction coverage because it catches untested decision paths that instruction coverage misses: a conditional with no instructions on the false branch (e.g. a guard `if`) gets 100% instruction coverage but 50% branch coverage when only one side is exercised. This gives stronger signal for domain logic.

**80%, not 90%.** The codebase measured 81% branch coverage on hand-written code at the time this gate was introduced (93.9% in the raw JaCoCo report, which was inflated by generated model classes with covered `equals`/`hashCode` branches). The threshold was set just below the actual baseline so the gate enforces the current standard without requiring immediate coverage improvement as a prerequisite.
