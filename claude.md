# Guitar Fretboard

A multi-string guitar fretboard diagram with 22 frets. Supports 1–8 strings with independently editable tunings, instrument presets, and interactive scale/interval visualization.

## Purpose

An interactive reference tool for visualizing note positions, intervals, and scale patterns across a fretboard. Useful for learning, practice, and exploring music theory.

## Tech Stack

Plain HTML + CSS + vanilla JS. No build tools, no dependencies. Open `index.html` to run.

## File Structure

- `index.html` — page structure and control layout
- `app.js` — all logic: presets, tuning state, dropdown population, grid rendering
- `style.css` — theming (dark/light), CSS grid fretboard layout, controls styling

## Core Concepts

### Pitch Calculation
Each fret corresponds to a pitch derived from:
- The string's open tuning (base note)
- Chromatic increments per fret (+1 semitone per fret)

### Multi-String Model
- `currentTunings` array holds open-string pitches (low to high index)
- Rendered top-to-bottom as highest string first (matching player perspective)
- Fretboard uses CSS grid: fret-number row, one row per string, dot-marker row
- Grid columns set dynamically in JS (`gridTemplateColumns`)

### Presets
`PRESETS` object defines instrument defaults (7-string guitar, 6-string guitar, 5-string bass, 4-string bass). Each is just a name + tuning array. Selecting a preset sets string count and tunings; users can freely edit individual strings afterward.

### Display Modes
Two interchangeable views, both derived from the same underlying pitch-class data:
- **Letter Name view**: C, C♯, D, D♯, E, F, F♯, G, G♯, A, A♯, B
- **Interval view**: 1, ♭2, 2, ♭3, 3, 4, ♭5, 5, ♭6, 6, ♭7, 7

### User Controls
- **Preset**: Sets string count + default tunings (convenience shortcut)
- **Per-string tuning**: Each string's open note is independently editable
- **+/− buttons**: Add or remove strings (min 1, max 8)
- **♯/♭ toggle**: Switches between sharp and flat note names globally
- **Root note**: Redefines interval relationships across all strings
- **Scale type**: A set of intervals (e.g., major, dorian, harmonic minor)
- **Display**: Switches between letter names and interval labels

### Visual Behavior
- Scale tones are emphasized (blue)
- Root note (interval = 0) receives special highlighting (red)
- Non-scale tones are hidden when a non-chromatic scale is selected
- Dark/light theme toggle with localStorage persistence

## Architecture Notes

The fretboard layout is a CSS grid rebuilt on every render. All musical meaning is computed dynamically based on:
1. `currentTunings` array (per-string open pitches)
2. Selected root note
3. Selected scale/mode
4. Current labeling mode (letters vs intervals)

Key functions:
- `render()` — clears and rebuilds the entire grid
- `buildTuningControls()` — rebuilds per-string tuning selects
- `populateNoteDropdowns()` — rebuilds root select + tuning controls (called on accidental toggle)
- `onPresetChange()` — applies a preset's tuning to state
- `clearPresetIfMismatch()` — deselects preset when user manually edits tunings
