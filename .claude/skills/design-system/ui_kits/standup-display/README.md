# Daily Fleece — Standup Display

A big-screen **1280 × 720** arcade-flavored leaderboard for the standup room.

## Usage
Open `index.html` on any browser connected to a meeting room display or share screen. The canvas letterboxes automatically to any viewport.

## Features
- Live clock, auto-scaling canvas
- Leaderboard with bar graph, streak badges, gold leader row
- Today's questions listed in the sidebar
- Session stats: # played, top score, best streak
- Tab switcher (Today / This week / All time) — visual only in this kit
- Confetti dots, purple-glow blob bg, grid overlay

## Wiring to real data
Replace `PLAYERS` in the `<script>` block with API-fetched data and call `renderBoard()` after each refresh.
