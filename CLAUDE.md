# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running

No build tools or dependencies. Open `index.html` directly in a browser.

## Architecture

Three files — `index.html`, `app.js`, `style.css` — with no build step. All logic lives in `app.js`.

### Data Flow

All state derives from: `currentTunings` (array of pitch-class integers 0–11, indexed low-to-high), the root note dropdown, three cascading scale dropdowns (note count → collection → mode), and the display mode. Every user interaction calls `render()`, which tears down and rebuilds the entire CSS grid.

### Fretboard Grid Structure

The grid has `TOTAL_FRETS + 1` columns (frets 0–22). Rows from top to bottom:
1. Fret number labels
2. One row per string (iterated high-to-low so highest-pitched string renders at top)
3. Dot markers (inlays at frets 3, 5, 7, 9, 12, 15, 17, 19, 21)

Each cell computes `pitch = (openTuning + fret) % 12`, then `interval = (pitch - root + 12) % 12` to determine scale membership and styling class (`is-root`, `in-scale`, or `hidden`).

### Scale System (3-level hierarchy)

Three separate dimensions, each with its own dropdown:

1. **Note Count** (`NOTE_COUNTS`): Cardinality — Chromatic, Triad, Pentatonic, Hexatonic, Heptatonic, Octatonic. Drives `#note-count` dropdown.
2. **Pitch Collection** (`COLLECTIONS`): A specific fixed set of pitch classes (e.g., Major triad `[0,4,7]`). Each entry has `{ key, noteCount, label, intervals, modes[] }`. Drives `#collection` dropdown, filtered by selected note count.
3. **Mode/Inversion** (`modes[]` within each collection): Rotations of the same pitch set. Index = degree index. Only musically distinct modes are listed (symmetric duplicates omitted, e.g., augmented triad has 1 mode, diminished octatonic has 2). Drives `#mode` dropdown.

`getModeIntervals(collectionIntervals, degreeIndex)` computes mode intervals dynamically by rotating the collection's pitch set. `getCurrentSelection()` reads all 3 dropdowns and returns `{ collection, degreeIndex }`.

Cascade: `#note-count` change → `populateCollectionSelect()` → `populateModeSelect()` → `render()`.

When adding a new scale: add it to `COLLECTIONS` with the correct `noteCount` key and list its modes. If the note count is new, also add to `NOTE_COUNTS`.

### Tuning Controls

`buildTuningControls()` dynamically creates per-string `<select>` elements plus +/− buttons. String numbering is player-convention (String 1 = highest pitch = last array index). `clearPresetIfMismatch()` auto-deselects the preset when manual edits diverge. `currentTunings[0]` is the lowest-pitched string.

### Position System

Positions divide the fretboard into playable regions (typically 4–5 fret spans). `getParentScaleInfo(collection, degreeIndex, root)` is trivial — the collection IS the parent, so `parentRoot = (root - collection.intervals[degreeIndex] + 12) % 12`. `computePositions(collection, degreeIndex, root, tunings)` generates one position per scale degree, anchored to where that degree falls on the lowest string. `allPitchClassesCovered()` validates that a window covers all scale tones with proper voice-leading between adjacent strings. Notes outside the active position get `out-of-position` class (dimmed) and cells get `out-of-position-cell` (blurred).

### Quiz Mode

Randomize picks a random root + collection + mode from `quizSelectedCollections` (a `Set` of collection keys). While `quizActive`, the fretboard is CSS-hidden and all dropdowns are disabled. "Show Answer" reveals it. The quiz mode picker is a custom dropdown with per-note-count group headers (with indeterminate state) and per-collection checkboxes.

### Theming

CSS custom properties in `:root` (dark) and `body.light` (light). Theme preference persists via `localStorage`. Note colors: root = `--root-bg` (terracotta), in-scale = `--scale-bg` (muted blue), out-of-scale = `--note-bg` (dim).

### Display Modes

Three options: "None" (no labels), "Letter Names" (pitch classes via `NOTE_NAMES_SHARP`/`NOTE_NAMES_FLAT`), "Intervals" (relative to root via `INTERVAL_NAMES`). The `accidentalMode` toggle swaps sharp/flat names and rebuilds all note dropdowns.

### Key Rendering Functions

- `render()` — full grid rebuild
- `buildTuningControls()` — per-string tuning UI
- `populateNoteDropdowns()` — root select + tuning controls (on accidental toggle)
- `populateNoteCountSelect()` — note count dropdown (once at startup)
- `populateCollectionSelect()` — collection dropdown (on note count change)
- `populateModeSelect()` — mode dropdown (on collection change)
- `onPresetChange()` — applies preset tuning to `currentTunings`
