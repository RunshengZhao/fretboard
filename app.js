const NOTE_NAMES_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NOTE_NAMES_FLAT  = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
let accidentalMode = 'sharp';
let quizActive = false;
let quizSelectedModes; // initialized after COLLECTIONS is defined
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

// --- Three-level scale system ---
// Level 1: Note count (cardinality)
// Level 2: Pitch collection (specific set of pitch classes)
// Level 3: Mode/inversion (rotation of the same pitch set)

const NOTE_COUNTS = [
  { key: 'chromatic', label: 'Chromatic' },
  { key: 'triad',     label: 'Triad' },
  { key: 'penta',     label: 'Pentatonic' },
  { key: 'hexa',      label: 'Hexatonic' },
  { key: 'hepta',     label: 'Heptatonic' },
  { key: 'octa',      label: 'Octatonic' },
];

// Each collection: { key, noteCount, label, intervals (root-position), modes[] }
// modes[i].label = display name; index = degree index for getModeIntervals()
// Only musically distinct modes are listed (symmetric duplicates omitted)
const COLLECTIONS = [
  // Chromatic
  {
    key: 'chromatic', noteCount: 'chromatic', label: 'Chromatic',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    modes: [{ label: 'Chromatic' }],
  },

  // Triads
  {
    key: 'triad_major', noteCount: 'triad', label: 'Major',
    intervals: [0, 4, 7],
    modes: [{ label: '1-3-5' }, { label: '1-♭3-♭6' }, { label: '1-4-6' }],
  },
  {
    key: 'triad_minor', noteCount: 'triad', label: 'Minor',
    intervals: [0, 3, 7],
    modes: [{ label: '1-♭3-5' }, { label: '1-3-6' }, { label: '1-4-♭6' }],
  },
  {
    key: 'triad_dim', noteCount: 'triad', label: 'Diminished',
    intervals: [0, 3, 6],
    modes: [{ label: '1-♭3-♭5' }, { label: '1-♭3-6' }, { label: '1-♭5-6' }],
  },
  {
    key: 'triad_aug', noteCount: 'triad', label: 'Augmented',
    intervals: [0, 4, 8],
    modes: [{ label: '1-3-♯5' }], // all inversions identical due to symmetry
  },
  {
    key: 'triad_sus', noteCount: 'triad', label: 'Sus',
    intervals: [0, 2, 7],
    modes: [{ label: '1-2-5' }, { label: '1-4-♭7' }, { label: '1-4-5' }],
  },

  // Pentatonic
  {
    key: 'penta_major', noteCount: 'penta', label: 'Major',
    intervals: [0, 2, 4, 7, 9],
    modes: [
      { label: 'Major Pentatonic' },
      { label: 'Mode 2' },
      { label: 'Mode 3' },
      { label: 'Mode 4' },
      { label: 'Minor Pentatonic' },
    ],
  },

  // Hexatonic
  {
    key: 'hexa_blues', noteCount: 'hexa', label: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    modes: [
      { label: 'Minor Blues' },
      { label: 'Major Blues' },
      { label: 'Mode 3' },
      { label: 'Mode 4' },
      { label: 'Mode 5' },
      { label: 'Mode 6' },
    ],
  },

  // Heptatonic
  {
    key: 'hepta_major', noteCount: 'hepta', label: 'Major',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    modes: [
      { label: 'Ionian (Major)' },
      { label: 'Dorian' },
      { label: 'Phrygian' },
      { label: 'Lydian' },
      { label: 'Mixolydian' },
      { label: 'Aeolian (Natural Minor)' },
      { label: 'Locrian' },
    ],
  },
  {
    key: 'hepta_harm_min', noteCount: 'hepta', label: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    modes: [
      { label: 'Harmonic Minor' },
      { label: 'Locrian ♮6' },
      { label: 'Ionian ♯5' },
      { label: 'Dorian ♯4' },
      { label: 'Phrygian Dominant' },
      { label: 'Lydian ♯9' },
      { label: 'Ultralocrian' },
    ],
  },
  {
    key: 'hepta_mel_min', noteCount: 'hepta', label: 'Melodic Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    modes: [
      { label: 'Melodic Minor' },
      { label: 'Phrygian ♮6 / Dorian ♭2' },
      { label: 'Lydian Augmented' },
      { label: 'Lydian Dominant' },
      { label: 'Mixolydian ♭6/Aeolian-Major' },
      { label: 'Locrian ♮2' },
      { label: 'Altered/Super-Locrian' },
    ],
  },
  {
    key: 'hepta_harm_maj', noteCount: 'hepta', label: 'Harmonic Major',
    intervals: [0, 2, 4, 5, 7, 8, 11],
    modes: [
      { label: 'Harmonic Major' },
      { label: 'Dorian ♭5' },
      { label: 'Altered ♮5/Phrygian ♭4' },
      { label: 'Lydian ♭3' },
      { label: 'Mixolydian ♭2' },
      { label: 'Lydian Augmented ♯2' },
      { label: 'Locrian ♭♭7' },
    ],
  },

  // Octatonic
  {
    key: 'octa_dim', noteCount: 'octa', label: 'Diminished',
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    modes: [{ label: 'Half-Whole' }, { label: 'Whole-Half' }], // only 2 distinct
  },
];

// Compute mode intervals by rotating a collection's pitch set
function getModeIntervals(collectionIntervals, degreeIndex) {
  return collectionIntervals
    .map(i => (i - collectionIntervals[degreeIndex] + 12) % 12)
    .sort((a, b) => a - b);
}

// Read current state from the 3 dropdowns
function getCurrentSelection() {
  const collectionKey = document.getElementById('collection').value;
  const degreeIndex = parseInt(document.getElementById('mode').value) || 0;
  const collection = COLLECTIONS.find(c => c.key === collectionKey);
  return { collection, degreeIndex };
}

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

// --- Three-level dropdown cascade ---

function populateNoteCountSelect() {
  const sel = document.getElementById('note-count');
  sel.innerHTML = '';
  NOTE_COUNTS.forEach(nc => {
    const opt = document.createElement('option');
    opt.value = nc.key;
    opt.textContent = nc.label;
    sel.appendChild(opt);
  });
}

function populateCollectionSelect() {
  const noteCountKey = document.getElementById('note-count').value;
  const sel = document.getElementById('collection');
  sel.innerHTML = '';
  COLLECTIONS
    .filter(c => c.noteCount === noteCountKey)
    .forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.key;
      opt.textContent = c.label;
      sel.appendChild(opt);
    });
  populateModeSelect();
}

function populateModeSelect() {
  const collectionKey = document.getElementById('collection').value;
  const collection = COLLECTIONS.find(c => c.key === collectionKey);
  const sel = document.getElementById('mode');
  sel.innerHTML = '';
  if (collection) {
    collection.modes.forEach((m, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = m.label;
      sel.appendChild(opt);
    });
  }
  render();
}

// --- Initialize dropdowns ---

populateNoteDropdowns(); // builds root select + tuning controls
populatePresetSelect();
populateNoteCountSelect();

document.getElementById('note-count').addEventListener('change', populateCollectionSelect);
document.getElementById('collection').addEventListener('change', populateModeSelect);

// Defaults: Heptatonic → Major → Ionian, Root = C, Display = Letter Names
document.getElementById('root').value = 0;
document.getElementById('note-count').value = 'hepta';
populateCollectionSelect();
document.getElementById('collection').value = 'hepta_major';
populateModeSelect();
document.getElementById('mode').value = '0';
document.getElementById('display').value = 'letters';

// --- Position system ---

function getParentScaleInfo(collection, degreeIndex, root) {
  if (collection.noteCount === 'chromatic') return null;
  const parentRoot = (root - collection.intervals[degreeIndex] + 12) % 12;
  return { parentRoot, parentIntervals: collection.intervals, degreeIndex };
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

function computePositions(collection, degreeIndex, root, tunings) {
  const info = getParentScaleInfo(collection, degreeIndex, root);
  if (!info) return [];

  const { parentRoot, parentIntervals } = info;
  const scaleIntervals = getModeIntervals(collection.intervals, degreeIndex);
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
  const { collection, degreeIndex } = getCurrentSelection();
  const root = parseInt(document.getElementById('root').value);
  const prevValue = sel.value;

  sel.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.value = '';
  allOpt.textContent = 'All';
  sel.appendChild(allOpt);

  if (!collection || collection.noteCount === 'chromatic') {
    sel.disabled = true;
    selectedPosition = null;
    return;
  }

  sel.disabled = quizActive;
  const positions = computePositions(collection, degreeIndex, root, currentTunings);
  const names = getNoteNames();
  const info = getParentScaleInfo(collection, degreeIndex, root);

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
  const { collection, degreeIndex } = getCurrentSelection();
  if (!collection) return;

  const root = parseInt(document.getElementById('root').value);
  const displayMode = document.getElementById('display').value;
  const scaleIntervals = getModeIntervals(collection.intervals, degreeIndex);
  const names = getNoteNames();

  populatePositionSelect();

  // Compute active position once for the entire render
  let activePos = null;
  if (selectedPosition !== null && collection.noteCount !== 'chromatic') {
    const positions = computePositions(collection, degreeIndex, root, currentTunings);
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
      } else if (collection.noteCount !== 'chromatic') {
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
  renderPermutationOutput();
});

// --- Event listeners ---

['root', 'mode', 'display'].forEach(id => {
  document.getElementById(id).addEventListener('change', render);
});

document.getElementById('position').addEventListener('change', () => {
  const val = document.getElementById('position').value;
  selectedPosition = val === '' ? null : parseInt(val);
  render();
});

document.getElementById('preset').addEventListener('change', onPresetChange);

// --- Quiz / Randomizer ---

function modeKey(collectionKey, modeIdx) {
  return `${collectionKey}::${modeIdx}`;
}

// Default: select only Ionian (Major) for quiz
quizSelectedModes = new Set();
quizSelectedModes.add(modeKey('hepta_major', 0));

function buildQuizModeDropdown() {
  const container = document.getElementById('quiz-mode-dropdown');
  container.innerHTML = '';

  NOTE_COUNTS.forEach(nc => {
    if (nc.key === 'chromatic') return;

    const collectionsInGroup = COLLECTIONS.filter(c => c.noteCount === nc.key);
    if (collectionsInGroup.length === 0) return;

    // Note-count header row (acts as select-all toggle)
    const group = document.createElement('div');
    group.className = 'quiz-mode-group';
    const groupRow = document.createElement('div');
    groupRow.className = 'quiz-mode-family';

    const groupToggle = document.createElement('button');
    groupToggle.type = 'button';
    groupToggle.className = 'quiz-toggle';
    groupToggle.setAttribute('aria-expanded', 'true');
    groupToggle.setAttribute('aria-label', `Toggle ${nc.label}`);
    groupToggle.addEventListener('click', () => {
      const isCollapsed = group.classList.toggle('collapsed');
      groupToggle.setAttribute('aria-expanded', String(!isCollapsed));
    });

    const groupLbl = document.createElement('label');
    const groupCb = document.createElement('input');
    groupCb.type = 'checkbox';
    groupCb.dataset.noteCount = nc.key;
    groupLbl.appendChild(groupCb);
    groupLbl.appendChild(document.createTextNode(nc.label));
    groupRow.appendChild(groupToggle);
    groupRow.appendChild(groupLbl);

    const groupBody = document.createElement('div');
    groupBody.className = 'quiz-mode-group-body';

    group.appendChild(groupRow);
    group.appendChild(groupBody);
    container.appendChild(group);

    const groupModeCbs = [];
    const groupCollections = [];
    let groupHasSelection = false;

    collectionsInGroup.forEach(coll => {
      const collectionWrap = document.createElement('div');
      collectionWrap.className = 'quiz-mode-collection';

      const collRow = document.createElement('div');
      collRow.className = 'quiz-mode-item quiz-mode-collection-header';

      const collToggle = document.createElement('button');
      collToggle.type = 'button';
      collToggle.className = 'quiz-toggle';
      collToggle.setAttribute('aria-expanded', 'true');
      collToggle.setAttribute('aria-label', `Toggle ${coll.label} modes`);
      collToggle.addEventListener('click', () => {
        const isCollapsed = collectionWrap.classList.toggle('collapsed');
        collToggle.setAttribute('aria-expanded', String(!isCollapsed));
      });

      const collLbl = document.createElement('label');
      const collCb = document.createElement('input');
      collCb.type = 'checkbox';
      collCb.value = coll.key;

      const modeRows = document.createElement('div');
      modeRows.className = 'quiz-mode-modes';

      const modeCbs = [];
      coll.modes.forEach((m, modeIdx) => {
        const key = modeKey(coll.key, modeIdx);
        if (quizSelectedModes.has(key)) groupHasSelection = true;
        const modeRow = document.createElement('div');
        modeRow.className = 'quiz-mode-subitem';
        const modeLbl = document.createElement('label');
        const modeCb = document.createElement('input');
        modeCb.type = 'checkbox';
        modeCb.value = key;
        modeCb.checked = quizSelectedModes.has(key);
        modeCb.addEventListener('change', () => {
          if (modeCb.checked) quizSelectedModes.add(key);
          else quizSelectedModes.delete(key);
          updateCollectionCheckbox(collCb, modeCbs);
          updateGroupCheckbox(groupCb, groupModeCbs);
          updateQuizModeBtn();
        });
        modeLbl.appendChild(modeCb);
        modeLbl.appendChild(document.createTextNode(m.label));
        modeRow.appendChild(modeLbl);
        modeCbs.push(modeCb);
        groupModeCbs.push(modeCb);
        modeRows.appendChild(modeRow);
      });

      collCb.addEventListener('change', () => {
        const checked = collCb.checked;
        modeCbs.forEach(cb => {
          cb.checked = checked;
          if (checked) quizSelectedModes.add(cb.value);
          else quizSelectedModes.delete(cb.value);
        });
        collCb.indeterminate = false;
        updateGroupCheckbox(groupCb, groupModeCbs);
        updateQuizModeBtn();
      });

      collLbl.appendChild(collCb);
      collLbl.appendChild(document.createTextNode(coll.label));
      collRow.appendChild(collToggle);
      collRow.appendChild(collLbl);

      collectionWrap.appendChild(collRow);
      collectionWrap.appendChild(modeRows);
      groupBody.appendChild(collectionWrap);

      updateCollectionCheckbox(collCb, modeCbs);
      if (collCb.checked || collCb.indeterminate) {
        collectionWrap.classList.remove('collapsed');
        collToggle.setAttribute('aria-expanded', 'true');
      } else {
        collectionWrap.classList.add('collapsed');
        collToggle.setAttribute('aria-expanded', 'false');
      }

      groupCollections.push({ collCb, modeCbs, collectionWrap, collToggle });
    });

    // Group checkbox toggles all its modes
    groupCb.addEventListener('change', () => {
      const checked = groupCb.checked;
      groupModeCbs.forEach(cb => {
        cb.checked = checked;
        if (checked) quizSelectedModes.add(cb.value);
        else quizSelectedModes.delete(cb.value);
      });
      groupCollections.forEach(({ collCb, modeCbs, collectionWrap, collToggle }) => {
        updateCollectionCheckbox(collCb, modeCbs);
        if (collCb.checked || collCb.indeterminate) {
          collectionWrap.classList.remove('collapsed');
          collToggle.setAttribute('aria-expanded', 'true');
        } else {
          collectionWrap.classList.add('collapsed');
          collToggle.setAttribute('aria-expanded', 'false');
        }
      });
      groupCb.indeterminate = false;
      updateQuizModeBtn();
    });

    updateGroupCheckbox(groupCb, groupModeCbs);
    if (!groupHasSelection && !groupCb.checked && !groupCb.indeterminate) {
      group.classList.add('collapsed');
      groupToggle.setAttribute('aria-expanded', 'false');
    }
  });

  updateQuizModeBtn();
}

function updateCollectionCheckbox(collectionCb, modeCbs) {
  const checkedCount = modeCbs.filter(cb => cb.checked).length;
  collectionCb.checked = checkedCount === modeCbs.length;
  collectionCb.indeterminate = checkedCount > 0 && checkedCount < modeCbs.length;
}

function updateGroupCheckbox(groupCb, modeCbs) {
  const checkedCount = modeCbs.filter(cb => cb.checked).length;
  groupCb.checked = checkedCount === modeCbs.length;
  groupCb.indeterminate = checkedCount > 0 && checkedCount < modeCbs.length;
}

function updateQuizModeBtn() {
  const btn = document.getElementById('quiz-mode-btn');
  btn.textContent = `Modes (${quizSelectedModes.size} selected)`;
  const noModes = quizSelectedModes.size === 0;
  document.getElementById('quiz-randomize').disabled = noModes;
  document.getElementById('permutation-generate').disabled = noModes;
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
  // Build pool: only selected modes
  const pool = [];
  COLLECTIONS.forEach(coll => {
    coll.modes.forEach((m, modeIdx) => {
      if (quizSelectedModes.has(modeKey(coll.key, modeIdx))) {
        pool.push({ collectionKey: coll.key, noteCount: coll.noteCount, modeIdx });
      }
    });
  });
  if (pool.length === 0) return;

  // Pick random root and mode
  const rootVal = Math.floor(Math.random() * 12);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const collection = COLLECTIONS.find(c => c.key === pick.collectionKey);

  // Set dropdown values via cascade
  document.getElementById('root').value = rootVal;
  document.getElementById('note-count').value = pick.noteCount;
  populateCollectionSelect();
  document.getElementById('collection').value = pick.collectionKey;
  populateModeSelect();
  document.getElementById('mode').value = pick.modeIdx;

  // Randomize position
  const positions = computePositions(collection, pick.modeIdx, rootVal, currentTunings);
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
  ['root', 'note-count', 'collection', 'mode', 'display', 'position'].forEach(id => {
    document.getElementById(id).disabled = quizActive;
  });
}

buildQuizModeDropdown();

document.getElementById('quiz-mode-btn').addEventListener('click', toggleQuizDropdown);
document.addEventListener('click', closeQuizDropdown);
document.getElementById('quiz-randomize').addEventListener('click', randomizeQuiz);
document.getElementById('quiz-show').addEventListener('click', showQuizAnswer);

// --- Scale Permutation ---

let lastPermutationResult = null; // cached for display-mode re-render

function getPositionNoteRange(scaleIntervals, root, tunings, position) {
  // Compute cumulative pitch offsets for each string (to determine absolute ordering)
  const offsets = [tunings[0]];
  for (let s = 1; s < tunings.length; s++) {
    offsets[s] = offsets[s - 1] + ((tunings[s] - tunings[s - 1] + 12) % 12);
  }

  // Use only the first window (lowest fret range) so the sequence stays
  // in one physical position, not spanning octave-apart duplicates
  const firstWindow = position.windows[0];
  const notes = [];
  for (let s = 0; s < tunings.length; s++) {
    for (let fret = firstWindow.start; fret <= firstWindow.end; fret++) {
      const pitch = (tunings[s] + fret) % 12;
      const interval = (pitch - root + 12) % 12;
      const degreeInScale = scaleIntervals.indexOf(interval);
      if (degreeInScale === -1) continue;
      const absolutePitch = offsets[s] + fret;
      const stringNum = tunings.length - s; // player convention: 1 = highest
      notes.push({ absolutePitch, pitchClass: pitch, interval, degreeInScale, stringNum });
    }
  }

  // Sort by absolute pitch, deduplicate by absolutePitch
  notes.sort((a, b) => a.absolutePitch - b.absolutePitch);
  const unique = [];
  let prev = -1;
  for (const n of notes) {
    if (n.absolutePitch !== prev) {
      unique.push(n);
      prev = n.absolutePitch;
    }
  }

  // Assign sequential index and 1-based degree number (cycling 1..N across octaves)
  for (let i = 0; i < unique.length; i++) {
    unique[i].seqIndex = i;
    unique[i].degreeNum = (unique[i].degreeInScale % scaleIntervals.length) + 1;
  }

  return unique;
}

function generateStepPattern(N) {
  const maxStep = Math.min(5, N - 1);
  const maxPatternLen = Math.min(4, N);
  const maxNetMotion = 2;

  for (let attempt = 0; attempt < 100; attempt++) {
    const patternLength = 1 + Math.floor(Math.random() * maxPatternLen);

    if (patternLength === 1) {
      return [Math.random() < 0.5 ? 1 : -1];
    }

    const steps = [];
    let valid = true;

    for (let i = 0; i < patternLength; i++) {
      // Build candidates: ±1..±maxStep, excluding 0
      const candidates = [];
      for (let s = 1; s <= maxStep; s++) {
        candidates.push(s, -s);
      }

      // Filter out immediate inverse of previous step
      const filtered = i === 0
        ? candidates
        : candidates.filter(c => c !== -steps[i - 1]);

      if (filtered.length === 0) { valid = false; break; }
      steps.push(filtered[Math.floor(Math.random() * filtered.length)]);
    }

    if (!valid) continue;

    // Check cyclic inverse: last step and first step
    if (steps[steps.length - 1] === -steps[0]) continue;

    // Reject all-identical steps (e.g. [+1,+1] is just [+1])
    if (steps.every(s => s === steps[0])) continue;

    const netMotion = steps.reduce((sum, s) => sum + s, 0);
    if (Math.abs(netMotion) > 0 && Math.abs(netMotion) <= maxNetMotion) {
      return steps;
    }
  }

  // Fallback
  return [1];
}

function parsePatternInput(str) {
  const trimmed = str.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  if (!trimmed) return { steps: null, error: 'Empty input' };
  const tokens = trimmed.split(',').map(t => t.trim());
  const steps = [];
  for (const t of tokens) {
    if (!/^[+-]?\d+$/.test(t)) return { steps: null, error: `Invalid token: "${t}"` };
    steps.push(parseInt(t, 10));
  }
  if (steps.length === 0) return { steps: null, error: 'No steps found' };
  return { steps, error: null };
}

function validatePattern(steps, N) {
  const maxStep = Math.min(5, N - 1);
  const maxPatternLen = Math.min(4, N);
  const maxNetMotion = 2;
  const netMotion = steps.reduce((sum, s) => sum + s, 0);

  const rules = [];

  rules.push({
    rule: 'No zeros',
    passed: steps.every(s => s !== 0),
    detail: 'Every step must be non-zero',
  });

  rules.push({
    rule: `Step range (±1..±${maxStep})`,
    passed: steps.every(s => Math.abs(s) >= 1 && Math.abs(s) <= maxStep),
    detail: `Each step within ±1 to ±${maxStep}`,
  });

  rules.push({
    rule: 'Single-step restriction',
    passed: steps.length !== 1 || Math.abs(steps[0]) === 1,
    detail: 'Length-1 patterns must be +1 or -1',
  });

  rules.push({
    rule: `Pattern length (1..${maxPatternLen})`,
    passed: steps.length >= 1 && steps.length <= maxPatternLen,
    detail: `Length must be 1 to ${maxPatternLen}`,
  });

  rules.push({
    rule: `Net motion (|${netMotion}| ≤ ${maxNetMotion}, ≠ 0)`,
    passed: Math.abs(netMotion) > 0 && Math.abs(netMotion) <= maxNetMotion,
    detail: `Sum of steps = ${netMotion}`,
  });

  let hasInverse = false;
  for (let i = 1; i < steps.length; i++) {
    if (steps[i] === -steps[i - 1]) { hasInverse = true; break; }
  }
  if (steps.length > 1 && steps[0] === -steps[steps.length - 1]) hasInverse = true;
  rules.push({
    rule: 'No immediate inverses',
    passed: !hasInverse,
    detail: 'No +k followed by -k (including cyclic)',
  });

  rules.push({
    rule: 'Not all identical',
    passed: steps.length <= 1 || !steps.every(s => s === steps[0]),
    detail: 'Multi-step patterns need distinct values',
  });

  return rules;
}

function generatePermutationSequence(noteRange, pattern) {
  const netMotion = pattern.reduce((sum, s) => sum + s, 0);
  const rangeLen = noteRange.length;

  // Compute max upward/downward excursion within one pattern cycle
  // so the start position leaves room for intermediate steps
  let prefixSum = 0;
  let maxExcursion = 0;
  let minExcursion = 0;
  for (const step of pattern) {
    prefixSum += step;
    maxExcursion = Math.max(maxExcursion, prefixSum);
    minExcursion = Math.min(minExcursion, prefixSum);
  }

  // Offset from edge: ascending starts near bottom but above any downward dips,
  // descending starts near top but below any upward peaks
  let currentIdx;
  const goalIdx = netMotion > 0 ? rangeLen - 1 : 0;
  if (netMotion > 0) {
    currentIdx = Math.max(0, -minExcursion);
  } else {
    currentIdx = Math.min(rangeLen - 1, rangeLen - 1 - maxExcursion);
  }
  const sequence = [noteRange[currentIdx]];

  // Stop when the sequence has visited the boundary note (highest for ascending,
  // lowest for descending), rather than a fixed 2×N count
  let reachedGoal = currentIdx === goalIdx;
  let patternIdx = 0;
  while (!reachedGoal) {
    currentIdx += pattern[patternIdx % pattern.length];
    if (currentIdx < 0 || currentIdx >= rangeLen) break;
    sequence.push(noteRange[currentIdx]);
    if (currentIdx === goalIdx) reachedGoal = true;
    patternIdx++;
  }

  return sequence;
}

function displayPermutation() {
  // End quiz if active
  if (quizActive) {
    quizActive = false;
    applyQuizState();
  }

  // Build pool from quizSelectedModes (same as quiz)
  const pool = [];
  COLLECTIONS.forEach(coll => {
    coll.modes.forEach((m, modeIdx) => {
      if (quizSelectedModes.has(modeKey(coll.key, modeIdx))) {
        pool.push({ collectionKey: coll.key, noteCount: coll.noteCount, modeIdx });
      }
    });
  });
  if (pool.length === 0) return;

  // Pick random root and mode
  const rootVal = Math.floor(Math.random() * 12);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const collection = COLLECTIONS.find(c => c.key === pick.collectionKey);

  // Set dropdown values via cascade
  document.getElementById('root').value = rootVal;
  document.getElementById('note-count').value = pick.noteCount;
  populateCollectionSelect();
  document.getElementById('collection').value = pick.collectionKey;
  populateModeSelect();
  document.getElementById('mode').value = pick.modeIdx;

  // Randomize position
  const positions = computePositions(collection, pick.modeIdx, rootVal, currentTunings);
  if (positions.length === 0) {
    document.getElementById('position').value = '';
    selectedPosition = null;
    render();
    document.getElementById('permutation-output').innerHTML = '';
    lastPermutationResult = null;
    return;
  }

  const chosen = positions[Math.floor(Math.random() * positions.length)];
  document.getElementById('position').value = chosen.degree;
  selectedPosition = chosen.degree;
  render();

  // Compute note range in position
  const scaleIntervals = getModeIntervals(collection.intervals, pick.modeIdx);
  const N = scaleIntervals.length;
  const noteRange = getPositionNoteRange(scaleIntervals, rootVal, currentTunings, chosen);

  if (noteRange.length < 2) {
    document.getElementById('permutation-output').innerHTML = '';
    lastPermutationResult = null;
    return;
  }

  // Generate step pattern and sequence
  const pattern = generateStepPattern(N);
  const sequence = generatePermutationSequence(noteRange, pattern);

  lastPermutationResult = { sequence, pattern, root: rootVal };
  renderPermutationOutput();
}

function renderPermutationOutput() {
  if (!lastPermutationResult) return;
  const { sequence, pattern, root } = lastPermutationResult;
  const displayMode = document.getElementById('display').value;
  const names = getNoteNames();

  const circledNums = ['', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
  const noteTexts = sequence.map(note => {
    let label;
    if (displayMode === 'letters') label = names[note.pitchClass];
    else if (displayMode === 'intervals') label = INTERVAL_NAMES[note.interval];
    else label = String(note.degreeNum);
    const str = circledNums[note.stringNum] || note.stringNum;
    return `${label}(${str})`;
  });

  const patternStr = pattern.map(s => (s > 0 ? '+' : '') + s).join(', ');

  const output = document.getElementById('permutation-output');
  output.innerHTML =
    `<div class="permutation-pattern">Pattern: [${patternStr}]</div>` +
    `<div class="permutation-notes">${noteTexts.join(' - ')}</div>`;
}

document.getElementById('permutation-generate').addEventListener('click', displayPermutation);

function displayCustomPermutation() {
  const input = document.getElementById('permutation-pattern-input').value;
  const { steps, error } = parsePatternInput(input);
  const output = document.getElementById('permutation-output');

  if (error) {
    output.innerHTML = `<div class="rule-fail">${error}</div>`;
    lastPermutationResult = null;
    return;
  }

  // Get N from current selection to validate against
  const { collection, degreeIndex } = getCurrentSelection();
  if (!collection || collection.noteCount === 'chromatic') {
    output.innerHTML = '<div class="rule-fail">Select a non-chromatic scale first</div>';
    lastPermutationResult = null;
    return;
  }
  const scaleIntervals = getModeIntervals(collection.intervals, degreeIndex);
  const N = scaleIntervals.length;

  // Validate and build rule checklist
  const rules = validatePattern(steps, N);
  const allPassed = rules.every(r => r.passed);
  const rulesHtml = '<div class="permutation-rules">' +
    rules.map(r =>
      `<span class="${r.passed ? 'rule-pass' : 'rule-fail'}">${r.passed ? '✓' : '✗'} ${r.rule}</span>`
    ).join('') + '</div>';

  if (!allPassed) {
    output.innerHTML = rulesHtml;
    lastPermutationResult = null;
    return;
  }

  // End quiz if active
  if (quizActive) {
    quizActive = false;
    applyQuizState();
  }

  // Randomize root/mode/position (same as displayPermutation)
  const pool = [];
  COLLECTIONS.forEach(coll => {
    coll.modes.forEach((_, modeIdx) => {
      if (quizSelectedModes.has(modeKey(coll.key, modeIdx))) {
        pool.push({ collectionKey: coll.key, noteCount: coll.noteCount, modeIdx });
      }
    });
  });
  if (pool.length === 0) return;

  const rootVal = Math.floor(Math.random() * 12);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const coll = COLLECTIONS.find(c => c.key === pick.collectionKey);

  document.getElementById('root').value = rootVal;
  document.getElementById('note-count').value = pick.noteCount;
  populateCollectionSelect();
  document.getElementById('collection').value = pick.collectionKey;
  populateModeSelect();
  document.getElementById('mode').value = pick.modeIdx;

  const positions = computePositions(coll, pick.modeIdx, rootVal, currentTunings);
  if (positions.length === 0) {
    output.innerHTML = rulesHtml + '<div class="rule-fail">No positions available</div>';
    lastPermutationResult = null;
    return;
  }

  const chosen = positions[Math.floor(Math.random() * positions.length)];
  document.getElementById('position').value = chosen.degree;
  selectedPosition = chosen.degree;
  render();

  const customScaleIntervals = getModeIntervals(coll.intervals, pick.modeIdx);
  const noteRange = getPositionNoteRange(customScaleIntervals, rootVal, currentTunings, chosen);

  if (noteRange.length < 2) {
    output.innerHTML = rulesHtml + '<div class="rule-fail">Not enough notes in position</div>';
    lastPermutationResult = null;
    return;
  }

  const sequence = generatePermutationSequence(noteRange, steps);
  lastPermutationResult = { sequence, pattern: steps, root: rootVal };

  // Show rules checklist above the notes
  renderPermutationOutput();
  output.innerHTML = rulesHtml + output.innerHTML;
}

document.getElementById('permutation-custom').addEventListener('click', displayCustomPermutation);
document.getElementById('permutation-pattern-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') displayCustomPermutation();
});

// Re-render permutation text when display mode changes
document.getElementById('display').addEventListener('change', renderPermutationOutput);

render();
