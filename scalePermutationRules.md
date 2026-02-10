# Scale Permutation Randomizer

## What It Does

Clicking "Scale Permutation" randomly picks a root note, mode (from the quiz mode picker pool), and fretboard position, then generates a note sequence by walking through the scale using a repeating step pattern. The fretboard updates to show the chosen position (visible, not hidden like quiz).

## Step Pattern Rules

A step pattern is a short array of signed integers (e.g., `[+1, +3, -1]`) that repeats cyclically to produce the note sequence. Given a scale with **N** notes:

| Rule | Constraint |
|------|-----------|
| Step range | ±1 to ±min(3, N-1), excluding 0 |
| Single-step restriction | If pattern length is 1, only +1 or -1 |
| Pattern length | 1 to min(3, N) steps |
| Net motion | 0 < \|sum of steps\| ≤ 2 |
| No immediate inverses | +k cannot be followed by -k (also checked cyclically between last and first step) |
| Not all identical | Multi-step patterns must have at least 2 distinct values (e.g., `[+1,+1]` is rejected — it's just `[+1]`) |

Generation retries up to 100 times to find a valid pattern; falls back to `[+1]`.

## Note Range

The playable range comes from the chosen position:

1. Compute cumulative pitch offsets per string to establish absolute pitch ordering
2. Use only the **first window** (lowest fret range) of the position — positions can repeat every 12 frets, but the sequence should stay in one physical region, not span octave-apart duplicates
3. Collect all in-scale notes across every string within that window
4. Sort by absolute pitch, remove duplicates
5. This ordered list is the range the step pattern navigates (index 0 = lowest, last index = highest)

Each note carries: pitch class, interval from root, cycling degree number (1 through N), and string number (①–⑧).

## Sequence Generation

1. Compute the pattern's **max upward excursion** and **max downward excursion** from one cycle of prefix sums — this determines how far intermediate steps stray from the net direction
2. Starting point: offset from the edge to leave room for intermediate steps:
   - Ascending (net motion > 0): start at `max(0, -minExcursion)` so downward dips don't go below index 0
   - Descending (net motion < 0): start at `min(last, last - maxExcursion)` so upward peaks don't exceed the range
3. Goal note: highest note in range for ascending, lowest for descending
4. Apply the step pattern cyclically — each step moves by that many positions in the ordered note list
5. Stop when the goal note is reached, or if the next step would go out of bounds

## Display

Output format follows the existing Display dropdown:

| Setting | Shows |
|---------|-------|
| Letter Names | Note names (C, D, E...), respects sharp/flat toggle |
| Intervals | Interval names relative to root (1, ♭3, 5...) |
| None | Scale degree numbers (1 through N, cycling across octaves) |

Each note includes a string indicator using circled numbers (e.g., `C(⑥) - D(⑤)`), showing which guitar string the note is on (① = highest string).

The pattern is shown above the notes (e.g., "Pattern: [+1, +3, -1]"). Changing the Display dropdown or the sharp/flat toggle re-renders the last generated sequence without regenerating.

## Custom Pattern Input

Users can type their own step pattern (e.g., `[+2,-1]`) in the input box and click "Use Pattern" (or press Enter).

### Parsing
The input is stripped of brackets, split by commas, and each token parsed as an integer. Invalid formats (non-numbers, empty input) show a parse error.

### Validation
The custom pattern is checked against all 7 rules listed above. A checklist is displayed showing ✓ or ✗ for each rule:

1. No zeros
2. Step range (±1..±min(3, N-1))
3. Single-step restriction (length-1 must be ±1)
4. Pattern length (1..min(3, N))
5. Net motion (0 < |sum| ≤ 2)
6. No immediate inverses (including cyclic)
7. Not all identical

If all rules pass, the system randomizes root/mode/position and generates the sequence using the custom pattern. If any rule fails, only the checklist is shown so the user can see what to fix.

# Curated pattern.
## 2nd
[+1]
[-1]
## 3rd
[+2,-1]: ascending in 3rds, /up,up,
[-2,+1]: descending in 3rds/down,down
[-2,+3]: down a 3rd, up a 4th./down,up
[+2, -1, -2, -1]: up a 3rd, up a 3rd, step down, down a 3rd, step down/up,down


## 4th
[+3,-2]: ascending in 4th.
