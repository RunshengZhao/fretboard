Add a function to generate a set of music notes (which can switch between Letter Names or Scale Degree numbers, based on user choice).
The external modes are selected via the modes selector dropdown menu.
The internal rule for generating sequences is as follows:
	1.	Notes are treated as elements of an ordered cyclic list (the scale).
	2.	Step offsets are signed integers:
	    •	Allowed range: ±1 … ±min(6, N-1) (excluding 0)
	    •	Single-step patterns are only allowed for ±1
	3.	Pattern length: 1–min(4, N) steps
	4.	Net motion (sum of steps) must satisfy: 0 < |netMotion| ≤ ceil(N/2)
	5.	Immediate inverse steps (e.g., +k, −k) are disallowed
	6.	Output sequence length: 2 × N notes, or until range boundary is reached

Users can click a button called “Scale Permutation” to generate a sequence of music notes according to these rules.
The function should:
	•	Dynamically generate a valid step-pattern sequence according to the rules above (no pre-stored pattern arrays needed)
	•	Map the sequence to the selected mode and Letter Name / Scale Degree view
	•	Return the generated sequence as text for display


# the Algorithm
Algorithm (app.js)

 Step 1: Randomize (reuse quiz pattern from randomizeQuiz())

 - Build pool from quizSelectedModes (same as quiz)
 - Pick random root + mode
 - Set dropdown values via cascade (same as quiz lines 854-859)
 - Pick random position (same as quiz lines 862-870)
 - Call render() to update fretboard (showing the position, NOT hidden like quiz)

 Step 2: Compute position note range

 New helper getPositionNoteRange(scaleIntervals, root, tunings, position):
 1. Compute absolute pitch offsets for each string: offsets[0] = tunings[0], then
 offsets[s] = offsets[s-1] + (tunings[s] - tunings[s-1] + 12) % 12
 2. For each string, for each fret in the position window, if the note is in the
 scale:
   - Compute absolute pitch: offsets[s] + fret
   - Compute degree index within scale: scaleIntervals.indexOf(interval)
   - Store as { absolutePitch, degreeInScale }
 3. Sort by absolute pitch, deduplicate
 4. Return ordered array — this is the playable sequence of scale notes within the
 position
 5. Also compute a sequential "degree index" for each (0, 1, 2, ...) — these are
 what the step pattern navigates

 Step 3: Generate step pattern

 generateStepPattern(N) where N = scale note count:
 1. maxStep = min(6, N - 1)
 2. patternLength = random(1, min(4, N))
 3. If patternLength === 1: return [+1] or [-1]
 4. For multi-step: pick random steps from ±1..±maxStep, no immediate inverses
 (including cyclic: last→first)
 5. Validate: 0 < |sum(steps)| ≤ ceil(N / 2)
 6. Retry if invalid (max 100 attempts, fallback to [+1])

 Step 4: Generate note sequence

 generatePermutationSequence(noteRange, pattern):
 1. targetLength = 2 * N (N = number of notes in the scale)
 2. Start position: if net motion > 0, start at index 0 (bottom of range); if < 0,
 start at last index
 3. Walk through noteRange indices using pattern cyclically
 4. Stop at targetLength notes or when index goes out of bounds (0 to
 noteRange.length - 1)
 5. Return array of notes from noteRange

 Step 5: Display

 displayPermutation():
 1. Do randomization (Step 1)
 2. Read display mode from #display dropdown
 3. Map sequence notes to text:
   - 'letters': getNoteNames()[note.pitchClass]
   - 'intervals': INTERVAL_NAMES[note.interval]
   - 'none': show scale degree numbers (1, 2, 3, ..., since there's no better
 default)
 4. Also show the pattern (e.g., "Pattern: +1, +3, -1") and position info
 5. Set #permutation-output textContent

 Event Wiring

 - #permutation-generate click → displayPermutation()
 - When #display changes and there's a cached permutation sequence → re-render the
 text

 Styling (style.css)

 .permutation-output {
   text-align: center;
   padding: 0.75rem 1rem;
   font-family: monospace;
   font-size: 0.95rem;
   color: var(--text);
   min-height: 0;
 }
 .permutation-output:empty {
   display: none;
 }

 Verification

 - Open index.html in browser
 - Select modes in the quiz mode picker
 - Click "Scale Permutation" — should randomize root/mode/position, show fretboard
 with position, display note sequence as text
 - Change Display dropdown (Letters/Intervals/None) — sequence text should update
 format
 - Click again — should generate different sequence
 - Test with triads (N=3), pentatonic (N=5), heptatonic (N=7), octatonic (N=8)
 - Verify step pattern rules: no immediate inverses, valid net motion, correct
 range bounds