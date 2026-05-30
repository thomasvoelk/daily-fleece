# Zoneless change detection

Angular's default change detection relies on Zone.js to monkey-patch browser APIs (setTimeout, Promise, XHR, etc.) and notify Angular when something might have changed. This works but comes with overhead: every async event triggers a top-down change detection sweep, and Zone.js itself adds ~50 kB to the bundle.

From Angular 21 onward, zoneless change detection is the default when Zone.js is not installed. No explicit provider is required. The Angular 21 CLI scaffold omits Zone.js from `package.json` and `angular.json` by default.

**We do not install Zone.js. No zone-related provider is added to `appConfig`.**

Change detection is driven entirely by Angular Signals. Components declare `ChangeDetectionStrategy.OnPush`; state lives in NgRx Signal Stores whose `patchState` calls notify the scheduler directly. No component needs Zone.js to trigger a re-render.

**Testing** uses `provideTestEnvironment()` from `src/testing/providers.ts`, which bundles `provideHttpClient()` and `provideHttpClientTesting()` for every component spec. Tests drive async sequences with `await drainMicrotasks()` (a plain `queueMicrotask` drain) rather than the zone-dependent `fakeAsync`/`flushMicrotasks` pair.

Zone.js must not be re-introduced. Any library that requires Zone.js is incompatible with this project.
