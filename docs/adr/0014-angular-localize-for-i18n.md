# Angular localize for i18n

The app UI must be in German. The team evaluated two options: `@angular/localize` (Angular's built-in compile-time i18n) and `ngx-translate` (a runtime translation library the team already knows).

**We use `@angular/localize`. The app is built and deployed as a single German-locale bundle.**

## Why compile-time over runtime

`ngx-translate` switches locales at runtime by loading a JSON file and resolving translations via a pipe. That power is wasted here: daily-fleece is a single-company app with one target language and no language-switcher requirement. The runtime translation layer adds bundle weight and indirection with no benefit.

`@angular/localize` bakes translations into the build. There is no runtime lookup, no extra service to inject, and no translation pipe in templates. Angular's toolchain (`ng extract-i18n`, `ng build --localize`) handles extraction and compilation natively.

## Source locale and translation files

English is the source locale — templates are written in English, which keeps source code readable regardless of the reader's German proficiency. `ng extract-i18n` produces `src/locale/messages.xlf` (XLIFF 1.2). The German translation lives in `src/locale/messages.de.xlf`.

## Message IDs

Every translatable string carries an explicit `@@id`. Auto-generated IDs are derived from the source text; changing the English wording silently breaks the link to the existing translation. Explicit IDs are stable.

Convention: `featureName.elementRole` — e.g. `lobby.heading`, `lobby.joinButton`, `voting.answeredCount`.

## Dynamic strings

ICU expressions (plural, select) are used wherever a string varies based on a count or enumerated state. Plural logic belongs in the translation file, not in template conditionals, so the German translator can apply German plural rules independently of the template.

## Country names (Q2)

Country names displayed in Q2 (geography question) are not template strings — they are derived from ISO 3166-1 alpha-2 codes at runtime. These are resolved using the browser's built-in `Intl.DisplayNames(['de'], { type: 'region' })` API, which provides German country names from the JS engine's locale dataset. No translation file or npm package is required.

## Scope boundary

`@angular/localize` covers Angular template strings only. Backend error messages are out of scope and deferred. Country names are handled by `Intl.DisplayNames` as described above.
