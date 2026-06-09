# Daily Fleece 🦙 — Design System

> A mobile-first quiz app for daily standups. Two questions per session — **Knowledge** and **Geography** — played on players' own devices, with a running leaderboard.

This repository is the **single source of truth** for the Daily Fleece brand: its voice, colors, type, mascot, components, and high-fidelity UI recreations. Any agent or designer should be able to read this folder and produce on-brand interfaces or assets.

---

## 1. Context & sources

Daily Fleece is a lightweight team ritual: every standup, each teammate pulls out their phone, answers two quick questions (one general-knowledge, one geography), and the scores roll up into a shared leaderboard. The product is a **mobile-first web app built on Angular Material**.

**Sources used to build this system:**
- The product one-liner and feature description (provided by the user).
- A design-direction questionnaire answered by the user: *retro-arcade + bold & playful aesthetic*, an **alpaca** team mascot (central to the brand), and an **Angular Material web app** as the primary surface.
- No codebase, Figma file, or existing brand assets were provided. **This system is an original creation** derived from the brief — it is a proposal to react to and refine, not a recreation of an existing product.

> ⚠️ Because there was no source codebase or Figma, every visual here (mascot, colors, type pairing, components) is a first proposal. Treat it as a starting point.

---

## 2. The big idea — "Cozy Arcade"

Daily Fleece lives at the collision of two feelings:

- **Warm wool** 🧶 — a standup is a comfortable, recurring team ritual. Creamy backgrounds, soft rounded corners, a huggable alpaca mascot.
- **Retro arcade** 🕹️ — the *game* is a punchy quiz show. Pixel scoreboards, chunky pressable buttons, confetti pops, a ticking timer.

The warmth keeps it human; the arcade keeps it fun. Never let it tip into either corporate-flat **or** chaotic-neon.

---

## 3. Content fundamentals (voice & tone)

**Vibe:** a cheerful quiz-show host who's also your teammate. Encouraging, never smug; fun, never childish.

- **Person:** Speak to the player as **"you"**. The app/mascot is a warm **"we/I"** when it cheers ("Nice one!", "Let's go!").
- **Length:** Short and punchy. Questions are one line. Prompts are a few words. *"Two questions. Ten seconds each. Go!"*
- **Casing:** Sentence case for everything readable (headings, buttons, body). **UPPERCASE is reserved for the pixel/arcade layer** — captions, category labels, scoreboards (`SCORE`, `RANK`, `KNOWLEDGE`).
- **Tone:** Cheeky and warm. Light llama/alpaca puns are welcome but rationed (don't pun every screen). Celebrate wins loudly, soften losses gently ("So close! Tomorrow's a fresh flock.").
- **Emoji:** Used sparingly as accents in *playful* copy and notifications (🦙 ✨ 🏆), **not** inside dense UI or as a substitute for real icons. The product's functional icons are Material Symbols (see §6).
- **Numbers:** Scores, ranks, streaks and timers are first-class — show them proudly in the pixel font.

**Examples**

| Do | Don't |
|---|---|
| "Nice one! That's a wrap on today's quiz 🦙" | "Quiz session completed successfully." |
| "Two questions. Ten seconds each. Go!" | "Please answer the following two questions within the allotted time." |
| "So close! Tomorrow's a fresh flock." | "Incorrect. Your answer was wrong." |
| "You're #1 today 👑" | "User ranking: position 1." |

---

## 4. Visual foundations

**Color.** Warm wool neutrals carry the surfaces; a saturated game-show accent set carries the energy. See `colors_and_type.css` for tokens.
- **Neutrals:** Cream `#FFF3E0` (app bg), Paper `#FFFBF4` (cards), Sunken wool `#F6E7CE`, Plum ink `#241B3A` + soft/faint tints for text.
- **Accents (each has a job):** Grape `#7C3AF0` = primary brand **+ Knowledge** category. Teal `#14B8A6` = **Geography** category. Marigold `#FFB422` = points/scores/highlights. Coral `#FF5A5F` = heat/streak/**wrong**. Green `#34C759` = **correct**. Sky `#3FA7F0` = informational.
- Categories are color-coded everywhere: **Knowledge = grape**, **Geography = teal**.

**Type.** Three families, three jobs (loaded from Google Fonts CDN):
- **Fredoka** (rounded, chunky) — display, headings, buttons, mascot speech.
- **Nunito** (warm, legible) — body, questions, answers, UI labels.
- **Press Start 2P** (pixel) — the arcade layer: scores, ranks, streaks, timers, the `DAILY` in the wordmark. Use *only* for short numeric/label bursts; never for reading copy.

**Spacing.** 4px base scale (`--sp-1`…`--sp-16`). Mobile gutters are 16–24px.

**Radii.** Generous and soft — wool is round. `sm 10 · md 16 · lg 24 · xl 32 · pill 999`. Buttons and chips are pills; cards are `md`/`lg`.

**Backgrounds.** Predominantly flat warm cream — **no busy gradients**. The "arcade" surfaces (Standup Display, results celebration) flip to a dark plum night with confetti dots and a subtle grid. Texture is welcome as faint dots/confetti, not heavy patterns.

**Elevation — two systems:**
1. **Soft shadows** (`--shadow-1/2/3`): warm-tinted, Material-ish; for cards, sheets, menus.
2. **Chunky arcade depth** (`--chunk-*`): a *hard, solid offset* shadow (e.g. `0 5px 0 darker`) under pressable elements — gives buttons a physical arcade-cabinet feel.

**Hover / press — the signature interaction.** Pressable buttons sit on their chunky hard shadow. On **press** they translate *down* (`translateY(5px)`) and the hard shadow collapses to `0` — the button physically depresses. Hover lightens/raises subtly. This tactile "clunk" is core to the brand; use it on primary actions and answer options.

**Motion.** Bouncy and brief. Entrances pop in with overshoot easing (`--ease-bounce`, `cubic-bezier(.34,1.56,.64,1)`). Scores **count up**. Correct answers pop with a spring + confetti; wrong answers shake gently. Durations 120–420ms. **Always respect `prefers-reduced-motion`** — fall back to instant/visible states.

**Borders.** Hairlines are warm (`--wool-line #EADBC2`) on cream. Selected/active states use a 2px accent border + a soft tint ring (`0 0 0 3px tint`). Answer options carry a 2px border that recolors by state.

**Transparency & blur.** Used lightly — e.g. a frosted top app bar over scrolling content, or tint rings. Avoid heavy glassmorphism.

**Imagery vibe.** Warm, friendly, slightly saturated. The mascot and any spot illustrations should feel huggable and rounded (no sharp realism). Geography questions may use simple map/flag imagery — keep it warm, never clinical.

**Cards.** Paper surface, `md`/`lg` radius, soft `shadow-1`, warm hairline border optional. Leaderboard "leader" card upgrades to `shadow-2` + a marigold border.

---

## 5. The mascot — Fleecey 🦙

A cheerful **alpaca** (the team mascot — note: alpaca, *not* llama) who hosts each standup and cheers players on. Round, woolly, confetti-ready.

- Current art: `assets/alpaca-mark.svg` — a **simple flat placeholder mark**. ⚠️ **Flag:** this is a stand-in. Replace with professional alpaca illustration (ideally a small expression set: happy, cheering, "so close", thinking).
- Use as the app icon, loading state, empty states, results celebration, and the logo lockup.

---

## 6. Iconography

The product is an **Angular Material** app, so the native, authentic icon set is **Material Symbols (Rounded)** — chosen for its round terminals that harmonize with Fredoka/Nunito.

- **Source:** linked from Google Fonts CDN: `Material Symbols Rounded`. No icon files are vendored; reference the font and use ligatures (e.g. `<span class="material-symbols-rounded">public</span>`).
- **Style:** Rounded, weight 500, optical size 24. Filled (`FILL 1`) for active/selected and category glyphs; outlined (`FILL 0`) for inert/secondary.
- **Common glyphs:** `psychology` (Knowledge), `public` (Geography), `stars`/`military_tech` (points), `leaderboard`, `local_fire_department` (streak), `bolt` (live), `check_circle` / `cancel` (answer feedback), `timer`, `crown`.
- **Emoji** are a *voice* device in copy/notifications only — never the functional UI icon layer.
- **Pixel glyphs:** numbers and short labels use Press Start 2P, not an icon.

> ⚠️ **Substitution flag:** With no source codebase, Material Symbols Rounded is the assumed icon set (it ships with Angular Material). Swap if the real app uses a different set.

---

## 7. Index — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — context, voice, visual foundations, iconography, index. |
| `SKILL.md` | Agent Skill manifest (for use in Claude Code). |
| `colors_and_type.css` | All design tokens: colors, type families + scale, spacing, radii, elevation, motion, plus semantic helper classes. **Import this everywhere.** |
| `assets/` | Brand assets. `alpaca-mark.svg` (placeholder mascot/logo mark). |
| `preview/` | Small specimen cards that populate the Design System tab (colors, type, spacing, components, brand). |
| `ui_kits/quiz-app/` | **Quiz App** UI kit — Angular-Material-flavored, mobile-first, interactive click-through. `index.html` + JSX components. |
| `ui_kits/standup-display/` | **Standup Display** UI kit — the big-screen arcade leaderboard for the standup room. |

**Fonts:** loaded via Google Fonts CDN (Fredoka, Nunito, Press Start 2P, Material Symbols Rounded). ⚠️ Not self-hosted — if you need offline/woff2, vendor them into `fonts/` and update `colors_and_type.css`.

---

## 8. Quick start

1. Link the tokens: `<link rel="stylesheet" href="colors_and_type.css">` (adjust relative path).
2. Use semantic type classes (`.t-h1`, `.t-body`, `.t-score`…) or the CSS vars directly.
3. Color categories: grape = Knowledge, teal = Geography, marigold = points.
4. Make primary actions *chunky and pressable*. Celebrate correct answers. Keep copy short and warm.
5. Pull components from the `ui_kits/` for real layouts.
