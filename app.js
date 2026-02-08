const NOTE_NAMES_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NOTE_NAMES_FLAT  = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
let accidentalMode = 'sharp';
let quizActive = false;
let quizSelectedModes; // initialized after SCALE_FAMILIES is defined
let selectedPosition = null; // null = show all, or 1..N for a specific position
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
  diminished_hw:    [0, 1, 3, 4, 6, 7, 9, 10],
  diminished_wh:    [0, 2, 3, 5, 6, 8, 9, 11],
};

// Two-level scale menu: [family key, family label, [[scale key, display label], ...]]
const SCALE_FAMILIES = [
  ['chromatic', 'Chromatic', [
    ['chromatic', 'Chromatic'],
  ]],
  ['major', 'Major', [
    ['ionian',     'Ionian (Major)'],
    ['dorian',     'Dorian'],
    ['phrygian',   'Phrygian'],
    ['lydian',     'Lydian'],
    ['mixolydian', 'Mixolydian'],
    ['aeolian',    'Aeolian (Natural Minor)'],
    ['locrian',    'Locrian'],
  ]],
  ['harmonic_minor', 'Harmonic Minor', [
    ['harmonic_minor',   'Harmonic Minor'],
    ['locrian_nat6',     'Locrian ♮6'],
    ['ionian_aug',       'Ionian ♯5'],
    ['dorian_sharp4',    'Dorian ♯4'],
    ['phrygian_dom',     'Phrygian Dominant'],
    ['lydian_sharp2',    'Lydian ♯9'],
    ['ultralocrian',     'Ultralocrian'],
  ]],
  ['melodic_minor', 'Melodic Minor', [
    ['melodic_minor',    'Melodic Minor'],
    ['dorian_b2',        'Phrygian ♮6 / Dorian ♭2'],
    ['lydian_aug',       'Lydian Augmented'],
    ['lydian_dom',       'Lydian Dominant'],
    ['mixolydian_b6',    'Mixolydian ♭6/Aeolian-Major'],
    ['locrian_nat2',     'Locrian ♮2'],
    ['altered',          'Altered/Super-Locrian'],
  ]],
  ['harmonic_major', 'Harmonic Major', [
    ['harmonic_major',   'Harmonic Major'],
    ['dorian_b5',        'Dorian ♭5'],
    ['phrygian_b4',      'Altered ♮5/Phrygian ♭4'],
    ['lydian_b3',        'Lydian ♭3'],
    ['mixolydian_b2',    'Mixolydian ♭2'],
    ['lydian_aug_s2',    'Lydian Augmented ♯2'],
    ['locrian_bb7',      'Locrian ♭♭7'],
  ]],
  ['pentatonic', 'Pentatonic', [
    ['pentatonic_major', 'Major Pentatonic'],
    ['pentatonic_minor', 'Minor Pentatonic'],
  ]],
  ['hexatonic', 'Hexatonic', [
    ['blues_minor',      'Minor Blues'],
    ['blues_major',      'Major Blues'],
  ]],
  ['octatonic', 'Octatonic', [
    ['diminished_hw',    'Diminished (Half-Whole)'],
    ['diminished_wh',    'Diminished (Whole-Half)'],
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

  // Per-string selects, numbered low-to-high (String 6/lowest = first in array)
  for (let i = 0; i < currentTunings.length; i++) {
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

// Populate scale family dropdown
(function populateScaleFamilySelect() {
  const sel = document.getElementById('scale-family');
  SCALE_FAMILIES.forEach(([key, label]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label;
    sel.appendChild(opt);
  });
})();

// Populate mode dropdown based on selected family
function populateScaleModeSelect() {
  const familyKey = document.getElementById('scale-family').value;
  const sel = document.getElementById('scale');
  sel.innerHTML = '';
  const family = SCALE_FAMILIES.find(([key]) => key === familyKey);
  if (family) {
    family[2].forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      sel.appendChild(opt);
    });
  }
  render();
}

document.getElementById('scale-family').addEventListener('change', populateScaleModeSelect);
populateScaleModeSelect();

// Default root = C, family = Major, mode = Ionian, display = Letter Names
document.getElementById('root').value = 0;
document.getElementById('scale-family').value = 'major';
populateScaleModeSelect();
document.getElementById('scale').value = 'ionian';
document.getElementById('display').value = 'letters';

// --- Position system ---

function getParentScaleInfo(scaleKey, root) {
  if (scaleKey === 'chromatic') return null;

  // Find which family contains this scale
  let familyEntry = null;
  for (const entry of SCALE_FAMILIES) {
    if (entry[2].some(([key]) => key === scaleKey)) {
      familyEntry = entry;
      break;
    }
  }
  if (!familyEntry) return null;

  const parentKey = familyEntry[2][0][0]; // first mode is the parent
  const parentIntervals = SCALES[parentKey];
  const modeIntervals = SCALES[scaleKey];

  // Algorithmically find degree offset: find d such that rotating the parent
  // by parentIntervals[d] yields the same pitch-class set as the mode
  const parentSet = new Set(parentIntervals);
  let degreeIndex = 0;
  for (let d = 0; d < parentIntervals.length; d++) {
    const offset = parentIntervals[d];
    const rotated = new Set(modeIntervals.map(i => (i + offset) % 12));
    if (rotated.size === parentSet.size && [...rotated].every(v => parentSet.has(v))) {
      degreeIndex = d;
      break;
    }
  }

  const parentRoot = (root - parentIntervals[degreeIndex] + 12) % 12;
  return { parentRoot, parentIntervals, degreeIndex };
}

function allPitchClassesCovered(startFret, width, scaleIntervals, root, tunings) {
  const degreeIndexByInterval = new Map();
  scaleIntervals.forEach((interval, idx) => degreeIndexByInterval.set(interval, idx));

  const covered = new Set();
  for (const tuning of tunings) {
    for (let f = startFret; f < startFret + width; f++) {
      const pitch = (tuning + f) % 12;
      const interval = (pitch - root + 12) % 12;
      if (scaleIntervals.includes(interval)) covered.add(interval);
    }
  }
  if (covered.size !== scaleIntervals.length) return false;

  let prevLastDegree = null;
  for (let s = 0; s < tunings.length; s++) {
    const tuning = tunings[s];
    const degreesOnString = [];
    for (let f = startFret; f < startFret + width; f++) {
      const pitch = (tuning + f) % 12;
      const interval = (pitch - root + 12) % 12;
      if (degreeIndexByInterval.has(interval)) {
        degreesOnString.push(degreeIndexByInterval.get(interval));
      }
    }

    if (degreesOnString.length === 0) return false;
    const firstDegree = degreesOnString[0];
    const lastDegree = degreesOnString[degreesOnString.length - 1];

    if (prevLastDegree !== null) {
      const nextDegree = (prevLastDegree + 1) % scaleIntervals.length;
      if (firstDegree !== prevLastDegree && firstDegree !== nextDegree) return false;
    }

    prevLastDegree = lastDegree;
  }

  return true;
}

function computePositions(scaleKey, root, tunings) {
  const info = getParentScaleInfo(scaleKey, root);
  if (!info) return [];

  const { parentRoot, parentIntervals } = info;
  const scaleIntervals = SCALES[scaleKey];
  const refTuning = tunings[0]; // lowest-pitched string
  const positions = [];

  const getPositionWindows = (anchorFret, width) => {
    const windows = [];
    let start = anchorFret;
    while (start < 0) start += 12;
    for (; start + width - 1 <= TOTAL_FRETS; start += 12) {
      windows.push({ start, end: start + width - 1 });
    }
    return windows;
  };

  for (let d = 0; d < parentIntervals.length; d++) {
    const anchorPitch = (parentRoot + parentIntervals[d]) % 12;
    const anchorFret = (anchorPitch - refTuning + 12) % 12;

    let width = 4;
    if (!allPitchClassesCovered(anchorFret, 4, scaleIntervals, root, tunings)) {
      width = 5;
    }

    const windows = getPositionWindows(anchorFret, width);
    if (windows.length === 0) continue;
    positions.push({ degree: d + 1, anchorFret, width, windows });
  }

  return positions;
}

function isNoteInPosition(fret, position) {
  if (position.windows) {
    return position.windows.some(w => fret >= w.start && fret <= w.end);
  }
  return ((fret - position.anchorFret + 12) % 12) < position.width;
}

// --- Position dropdown ---

function populatePositionSelect() {
  const sel = document.getElementById('position');
  const scaleKey = document.getElementById('scale').value;
  const root = parseInt(document.getElementById('root').value);
  const prevValue = sel.value;

  sel.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.value = '';
  allOpt.textContent = 'All';
  sel.appendChild(allOpt);

  if (scaleKey === 'chromatic') {
    sel.disabled = true;
    selectedPosition = null;
    return;
  }

  sel.disabled = quizActive;
  const positions = computePositions(scaleKey, root, currentTunings);
  const names = getNoteNames();
  const info = getParentScaleInfo(scaleKey, root);

  positions.forEach(pos => {
    const anchorPitch = (info.parentRoot + info.parentIntervals[pos.degree - 1]) % 12;
    const opt = document.createElement('option');
    opt.value = pos.degree;
    opt.textContent = `Position ${pos.degree} (${names[anchorPitch]})`;
    sel.appendChild(opt);
  });

  // Preserve selection if still valid
  if (prevValue && sel.querySelector(`option[value="${prevValue}"]`)) {
    sel.value = prevValue;
  } else {
    sel.value = '';
    selectedPosition = null;
  }
}

// --- Rendering ---

function render() {
  const root = parseInt(document.getElementById('root').value);
  const scaleKey = document.getElementById('scale').value;
  const displayMode = document.getElementById('display').value;
  const scaleIntervals = SCALES[scaleKey];
  const names = getNoteNames();

  populatePositionSelect();

  // Compute active position once for the entire render
  let activePos = null;
  if (selectedPosition !== null && scaleKey !== 'chromatic') {
    const positions = computePositions(scaleKey, root, currentTunings);
    activePos = positions.find(p => p.degree === selectedPosition) || null;
  }

  const fretboard = document.getElementById('fretboard');
  fretboard.innerHTML = '';
  const fretboardWrapper = document.querySelector('.fretboard-wrapper');
  fretboardWrapper.classList.toggle('position-focus', Boolean(activePos));

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
        : displayMode === 'intervals'
        ? INTERVAL_NAMES[interval]
        : '';

      const cellDiv = document.createElement('div');
      cellDiv.className = 'fret-cell';
      if (fret === 0) cellDiv.classList.add('nut');

      const noteDiv = document.createElement('div');
      noteDiv.className = 'note';

      // Position filtering
      const inPosition = !activePos || isNoteInPosition(fret, activePos);
      const outOfPosition = activePos && (isRoot || inScale) && !inPosition;
      if (activePos && !inPosition) {
        cellDiv.classList.add('out-of-position-cell');
      }

      if (isRoot) {
        noteDiv.classList.add('is-root');
        if (outOfPosition) noteDiv.classList.add('out-of-position');
      } else if (inScale) {
        noteDiv.classList.add('in-scale');
        if (outOfPosition) noteDiv.classList.add('out-of-position');
      } else if (scaleKey !== 'chromatic') {
        noteDiv.classList.add('hidden');
      }

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

document.getElementById('position').addEventListener('change', () => {
  const val = document.getElementById('position').value;
  selectedPosition = val === '' ? null : parseInt(val);
  render();
});

document.getElementById('preset').addEventListener('change', onPresetChange);

// --- Quiz / Randomizer ---

// Initialize quizSelectedModes now that SCALE_FAMILIES is defined
quizSelectedModes = new Set(
  SCALE_FAMILIES
    .filter(([key]) => key === 'harmonic_major')
    .flatMap(([, , modes]) => modes.map(([modeKey]) => modeKey))
);

function buildQuizModeDropdown() {
  const container = document.getElementById('quiz-mode-dropdown');
  container.innerHTML = '';

  SCALE_FAMILIES.forEach(([familyKey, familyLabel, modes]) => {
    if (familyKey === 'chromatic') return;

    // Family header row
    const familyRow = document.createElement('div');
    familyRow.className = 'quiz-mode-family';
    const familyLbl = document.createElement('label');
    const familyCb = document.createElement('input');
    familyCb.type = 'checkbox';
    familyCb.dataset.family = familyKey;
    familyLbl.appendChild(familyCb);
    familyLbl.appendChild(document.createTextNode(familyLabel));
    familyRow.appendChild(familyLbl);
    container.appendChild(familyRow);

    // Mode rows
    const modeCbs = [];
    modes.forEach(([modeKey, modeLabel]) => {
      const modeRow = document.createElement('div');
      modeRow.className = 'quiz-mode-item';
      const modeLbl = document.createElement('label');
      const modeCb = document.createElement('input');
      modeCb.type = 'checkbox';
      modeCb.value = modeKey;
      modeCb.checked = quizSelectedModes.has(modeKey);
      modeCb.addEventListener('change', () => {
        if (modeCb.checked) quizSelectedModes.add(modeKey);
        else quizSelectedModes.delete(modeKey);
        updateFamilyCheckbox(familyCb, modeCbs);
        updateQuizModeBtn();
      });
      modeLbl.appendChild(modeCb);
      modeLbl.appendChild(document.createTextNode(modeLabel));
      modeRow.appendChild(modeLbl);
      container.appendChild(modeRow);
      modeCbs.push(modeCb);
    });

    // Family checkbox toggles all its modes
    familyCb.addEventListener('change', () => {
      const checked = familyCb.checked;
      modeCbs.forEach(cb => {
        cb.checked = checked;
        if (checked) quizSelectedModes.add(cb.value);
        else quizSelectedModes.delete(cb.value);
      });
      familyCb.indeterminate = false;
      updateQuizModeBtn();
    });

    // Set initial family checkbox state
    updateFamilyCheckbox(familyCb, modeCbs);
  });

  updateQuizModeBtn();
}

function updateFamilyCheckbox(familyCb, modeCbs) {
  const checkedCount = modeCbs.filter(cb => cb.checked).length;
  familyCb.checked = checkedCount === modeCbs.length;
  familyCb.indeterminate = checkedCount > 0 && checkedCount < modeCbs.length;
}

function updateQuizModeBtn() {
  const btn = document.getElementById('quiz-mode-btn');
  btn.textContent = `Modes (${quizSelectedModes.size} selected)`;
  document.getElementById('quiz-randomize').disabled = quizSelectedModes.size === 0;
}

function toggleQuizDropdown() {
  document.getElementById('quiz-mode-dropdown').classList.toggle('open');
}

function closeQuizDropdown(e) {
  const picker = document.getElementById('quiz-mode-picker');
  if (!picker.contains(e.target)) {
    document.getElementById('quiz-mode-dropdown').classList.remove('open');
  }
}

function randomizeQuiz() {
  // Build pool from individually selected modes
  const pool = [];
  SCALE_FAMILIES.forEach(([familyKey, , modes]) => {
    modes.forEach(([modeKey]) => {
      if (quizSelectedModes.has(modeKey)) {
        pool.push({ familyKey, modeKey });
      }
    });
  });
  if (pool.length === 0) return;

  // Pick random root and mode
  const rootVal = Math.floor(Math.random() * 12);
  const pick = pool[Math.floor(Math.random() * pool.length)];

  // Set dropdown values
  document.getElementById('root').value = rootVal;
  document.getElementById('scale-family').value = pick.familyKey;
  populateScaleModeSelect();
  document.getElementById('scale').value = pick.modeKey;
  // Randomize position (exclude "All") if any valid positions exist
  const positions = computePositions(pick.modeKey, rootVal, currentTunings);
  if (positions.length > 0) {
    const chosen = positions[Math.floor(Math.random() * positions.length)];
    document.getElementById('position').value = chosen.degree;
    selectedPosition = chosen.degree;
  } else {
    document.getElementById('position').value = '';
    selectedPosition = null;
  }

  render();

  quizActive = true;
  applyQuizState();
}

function showQuizAnswer() {
  quizActive = false;
  applyQuizState();
}

function applyQuizState() {
  const wrapper = document.querySelector('.fretboard-wrapper');
  wrapper.classList.toggle('quiz-hidden', quizActive);

  document.getElementById('quiz-show').disabled = !quizActive;

  // Disable/enable dropdowns to prevent peeking
  ['root', 'scale-family', 'scale', 'display', 'position'].forEach(id => {
    document.getElementById(id).disabled = quizActive;
  });
}

buildQuizModeDropdown();

document.getElementById('quiz-mode-btn').addEventListener('click', toggleQuizDropdown);
document.addEventListener('click', closeQuizDropdown);
document.getElementById('quiz-randomize').addEventListener('click', randomizeQuiz);
document.getElementById('quiz-show').addEventListener('click', showQuizAnswer);

render();
