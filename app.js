const NOTE_NAMES_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NOTE_NAMES_FLAT  = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
let accidentalMode = 'sharp';
const INTERVAL_NAMES = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'];
const TOTAL_FRETS = 22;

// Frets that get dot markers (standard guitar inlays)
const SINGLE_DOT_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_DOT_FRETS = [12];

const PRESETS = {
  guitar_7: { name: '7-String Guitar', tuning: [11, 4, 9, 2, 7, 11, 4] },
  guitar_6: { name: '6-String Guitar', tuning: [4, 9, 2, 7, 11, 4] },
  bass_5:   { name: '5-String Bass',   tuning: [11, 4, 9, 2, 7] },
  bass_4:   { name: '4-String Bass',   tuning: [4, 9, 2, 7] },
};

let currentTunings = [...PRESETS.guitar_6.tuning]; // default 6-string

const SCALES = {
  chromatic:        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  ionian:           [0, 2, 4, 5, 7, 9, 11],
  dorian:           [0, 2, 3, 5, 7, 9, 10],
  phrygian:         [0, 1, 3, 5, 7, 8, 10],
  lydian:           [0, 2, 4, 6, 7, 9, 11],
  mixolydian:       [0, 2, 4, 5, 7, 9, 10],
  aeolian:          [0, 2, 3, 5, 7, 8, 10],
  locrian:          [0, 1, 3, 5, 6, 8, 10],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  blues_minor:      [0, 3, 5, 6, 7, 10],
  blues_major:      [0, 2, 3, 4, 7, 9],
  harmonic_minor:   [0, 2, 3, 5, 7, 8, 11],
  locrian_nat6:     [0, 1, 3, 5, 6, 9, 10],
  ionian_aug:       [0, 2, 4, 5, 8, 9, 11],
  dorian_sharp4:    [0, 2, 3, 6, 7, 9, 10],
  phrygian_dom:     [0, 1, 4, 5, 7, 8, 10],
  lydian_sharp2:    [0, 3, 4, 6, 7, 9, 11],
  ultralocrian:     [0, 1, 3, 4, 6, 8, 9],
  melodic_minor:    [0, 2, 3, 5, 7, 9, 11],
  dorian_b2:        [0, 1, 3, 5, 7, 9, 10],
  lydian_aug:       [0, 2, 4, 6, 8, 9, 11],
  lydian_dom:       [0, 2, 4, 6, 7, 9, 10],
  mixolydian_b6:    [0, 2, 4, 5, 7, 8, 10],
  locrian_nat2:     [0, 2, 3, 5, 6, 8, 10],
  altered:          [0, 1, 3, 4, 6, 8, 10],
  harmonic_major:   [0, 2, 4, 5, 7, 8, 11],
  dorian_b5:        [0, 2, 3, 5, 6, 9, 10],
  phrygian_b4:      [0, 1, 3, 4, 7, 8, 10],
  lydian_b3:        [0, 2, 3, 6, 7, 9, 11],
  mixolydian_b2:    [0, 1, 4, 5, 7, 9, 10],
  lydian_aug_s2:    [0, 3, 4, 6, 8, 9, 11],
  locrian_bb7:      [0, 1, 3, 5, 6, 8, 9],
};

// Grouped scale menu: [group label, [[key, display label], ...]]
const SCALE_GROUPS = [
  [null, [
    ['chromatic', 'Chromatic'],
  ]],
  ['Major Modes', [
    ['ionian',     'Ionian (Major)'],
    ['dorian',     'Dorian'],
    ['phrygian',   'Phrygian'],
    ['lydian',     'Lydian'],
    ['mixolydian', 'Mixolydian'],
    ['aeolian',    'Aeolian (Natural Minor)'],
    ['locrian',    'Locrian'],
  ]],
  ['Harmonic Minor', [
    ['harmonic_minor',   'Harmonic Minor'],
    ['locrian_nat6',     'Locrian ♮6'],
    ['ionian_aug',       'Ionian ♯5'],
    ['dorian_sharp4',    'Dorian ♯4'],
    ['phrygian_dom',     'Phrygian Dominant'],
    ['lydian_sharp2',    'Lydian ♯9'],
    ['ultralocrian',     'Ultralocrian'],
  ]],
  ['Melodic Minor', [
    ['melodic_minor',    'Melodic Minor'],
    ['dorian_b2',        'Phrygian ♮6 / Dorian ♭2'],
    ['lydian_aug',       'Lydian Augmented'],
    ['lydian_dom',       'Lydian Dominant'],
    ['mixolydian_b6',    'Mixolydian ♭6/Aeolian-Major'],
    ['locrian_nat2',     'Locrian ♮2'],
    ['altered',          'Altered/Super-Locrian'],
  ]],
  ['Harmonic Major', [
    ['harmonic_major',   'Harmonic Major'],
    ['dorian_b5',        'Dorian ♭5'],
    ['phrygian_b4',      'Phrygian ♭4'],
    ['lydian_b3',        'Lydian ♭3'],
    ['mixolydian_b2',    'Mixolydian ♭2'],
    ['lydian_aug_s2',    'Lydian Augmented ♯2'],
    ['locrian_bb7',      'Locrian ♭♭7'],
  ]],
  ['Other', [
    ['pentatonic_major', 'Major Pentatonic'],
    ['pentatonic_minor', 'Minor Pentatonic'],
    ['blues_minor',      'Minor Blues'],
    ['blues_major',      'Major Blues'],
  ]],
];

// --- Populate dropdowns ---

function getNoteNames() {
  return accidentalMode === 'sharp' ? NOTE_NAMES_SHARP : NOTE_NAMES_FLAT;
}

function populateSelect(sel, options) {
  options.forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    sel.appendChild(opt);
  });
}

function populateNoteDropdowns() {
  const names = getNoteNames();
  // Only rebuild root select (tuning selects handled by buildTuningControls)
  const sel = document.getElementById('root');
  const current = sel.value;
  sel.innerHTML = '';
  populateSelect(sel, names.map((n, i) => [i, n]));
  sel.value = current;
  // Rebuild tuning controls to reflect new accidental names
  buildTuningControls();
}

function populatePresetSelect() {
  const sel = document.getElementById('preset');
  Object.entries(PRESETS).forEach(([key, preset]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = preset.name;
    sel.appendChild(opt);
  });
  sel.value = 'guitar_6';
}

// --- Per-string tuning controls ---

function buildTuningControls() {
  const container = document.getElementById('tuning-controls');
  container.innerHTML = '';
  const names = getNoteNames();

  // Remove string button
  const removeBtn = document.createElement('button');
  removeBtn.className = 'string-btn';
  removeBtn.textContent = '−';
  removeBtn.title = 'Remove string';
  removeBtn.disabled = currentTunings.length <= 1;
  removeBtn.addEventListener('click', () => {
    if (currentTunings.length > 1) {
      currentTunings.pop();
      clearPresetIfMismatch();
      buildTuningControls();
      render();
    }
  });
  container.appendChild(removeBtn);

  // Per-string selects, numbered high-to-low (String 1 = highest pitch = last in array)
  for (let i = currentTunings.length - 1; i >= 0; i--) {
    const stringNum = currentTunings.length - i;
    const label = document.createElement('label');
    label.innerHTML = `<span>String ${stringNum}</span>`;
    const sel = document.createElement('select');
    populateSelect(sel, names.map((n, idx) => [idx, n]));
    sel.value = currentTunings[i];
    sel.addEventListener('change', () => {
      currentTunings[i] = parseInt(sel.value);
      clearPresetIfMismatch();
      render();
    });
    label.appendChild(sel);
    container.appendChild(label);
  }

  // Add string button
  const addBtn = document.createElement('button');
  addBtn.className = 'string-btn';
  addBtn.textContent = '+';
  addBtn.title = 'Add string';
  addBtn.disabled = currentTunings.length >= 8;
  addBtn.addEventListener('click', () => {
    if (currentTunings.length < 8) {
      currentTunings.unshift(4); // default new low string to E
      clearPresetIfMismatch();
      buildTuningControls();
      render();
    }
  });
  container.appendChild(addBtn);
}

function clearPresetIfMismatch() {
  const presetSel = document.getElementById('preset');
  const key = presetSel.value;
  if (key && PRESETS[key]) {
    const preset = PRESETS[key];
    if (preset.tuning.length !== currentTunings.length ||
        !preset.tuning.every((v, i) => v === currentTunings[i])) {
      presetSel.value = '';
    }
  }
}

function onPresetChange() {
  const key = document.getElementById('preset').value;
  if (key && PRESETS[key]) {
    currentTunings = [...PRESETS[key].tuning];
    buildTuningControls();
    render();
  }
}

// --- Initialize dropdowns ---

populateNoteDropdowns(); // builds root select + tuning controls
populatePresetSelect();

// Populate scale dropdown with optgroups
(function populateScaleSelect() {
  const sel = document.getElementById('scale');
  SCALE_GROUPS.forEach(([groupLabel, items]) => {
    const parent = groupLabel
      ? (() => { const g = document.createElement('optgroup'); g.label = groupLabel; sel.appendChild(g); return g; })()
      : sel;
    items.forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      parent.appendChild(opt);
    });
  });
})();

// Default root = E
document.getElementById('root').value = 4;

// --- Rendering ---

function render() {
  const root = parseInt(document.getElementById('root').value);
  const scaleKey = document.getElementById('scale').value;
  const displayMode = document.getElementById('display').value;
  const scaleIntervals = SCALES[scaleKey];
  const names = getNoteNames();

  const fretboard = document.getElementById('fretboard');
  fretboard.innerHTML = '';

  const cols = TOTAL_FRETS + 1; // 0 through 22
  fretboard.style.gridTemplateColumns = `repeat(${cols}, 52px)`;

  // Row 1: Fret numbers
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const div = document.createElement('div');
    div.className = 'fret-number';
    div.textContent = fret === 0 ? 'Open' : fret;
    fretboard.appendChild(div);
  }

  // String rows: iterate high-to-low (highest string at top)
  for (let s = currentTunings.length - 1; s >= 0; s--) {
    const tuning = currentTunings[s];
    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      const pitch = (tuning + fret) % 12;
      const interval = (pitch - root + 12) % 12;
      const inScale = scaleIntervals.includes(interval);
      const isRoot = interval === 0;

      const label = displayMode === 'letters'
        ? names[pitch]
        : INTERVAL_NAMES[interval];

      const cellDiv = document.createElement('div');
      cellDiv.className = 'fret-cell';
      if (fret === 0) cellDiv.classList.add('nut');

      const noteDiv = document.createElement('div');
      noteDiv.className = 'note';
      if (isRoot) noteDiv.classList.add('is-root');
      else if (inScale) noteDiv.classList.add('in-scale');
      else if (scaleKey !== 'chromatic') noteDiv.classList.add('hidden');
      noteDiv.textContent = label;
      cellDiv.appendChild(noteDiv);

      fretboard.appendChild(cellDiv);
    }
  }

  // Last row: Dot markers
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const markerDiv = document.createElement('div');
    markerDiv.className = 'fret-marker';
    const dotCount = DOUBLE_DOT_FRETS.includes(fret) ? 2
      : SINGLE_DOT_FRETS.includes(fret) ? 1 : 0;
    for (let d = 0; d < dotCount; d++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      markerDiv.appendChild(dot);
    }
    fretboard.appendChild(markerDiv);
  }
}

// --- Theme toggle ---

const toggleBtn = document.getElementById('theme-toggle');

function applyTheme(isLight) {
  document.body.classList.toggle('light', isLight);
  toggleBtn.textContent = isLight ? 'Light' : 'Dark';
}

toggleBtn.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light');
  toggleBtn.textContent = isLight ? 'Light' : 'Dark';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// Restore saved preference
applyTheme(localStorage.getItem('theme') === 'light');

// --- Accidental toggle ---

const accidentalBtn = document.getElementById('accidental-toggle');
accidentalBtn.addEventListener('click', () => {
  accidentalMode = accidentalMode === 'sharp' ? 'flat' : 'sharp';
  accidentalBtn.textContent = accidentalMode === 'sharp' ? '♯' : '♭';
  populateNoteDropdowns();
  render();
});

// --- Event listeners ---

['root', 'scale', 'display'].forEach(id => {
  document.getElementById(id).addEventListener('change', render);
});

document.getElementById('preset').addEventListener('change', onPresetChange);

render();
