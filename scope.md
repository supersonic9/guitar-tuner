# Guitar Tuner Web App ("tuna") — Implementation Scope

> Scope document for Claude Code. Do not deviate from decisions made here.
> Hosting: Netlify | Stack: TypeScript + Vite | Pitch detection: YIN via pitchfinder

---

## What It Does

A web app that listens via the device microphone, detects the pitch of a guitar string being plucked, and displays:
- The closest guitar note (E, A, D, G, B, e — standard tuning)
- Whether it's flat, sharp, or in tune
- Cents deviation from the target pitch

All processing happens client-side in the browser. No backend required.

---

## Technical Decisions (do not revisit)

| Decision | Choice | Reason |
|---|---|---|
| Platform | Web (browser) | Cross-platform, no install, Netlify hosting |
| Language | TypeScript | Type safety, Vite support |
| Build tool | Vite (vanilla-ts template) | Zero config, fast HMR |
| Pitch detection | YIN algorithm via `pitchfinder` npm package | Best accuracy for monophonic guitar, no math to implement |
| UI framework | None (vanilla HTML/CSS/TS) | Overkill for this scope |
| Hosting | Netlify | Existing account; auto-HTTPS (required for mic access) |

---

## File Structure

```
guitar-tuner/
├── index.html              # App shell, single page
├── package.json
├── tsconfig.json
├── vite.config.ts
├── netlify.toml            # Build + deploy config
├── scope.md                # This file
└── src/
    ├── main.ts             # Entry: wires audio → pitch → ui, handles start/stop
    ├── audio.ts            # Mic capture, AudioContext, AnalyserNode, read loop
    ├── pitch.ts            # YIN pitch detection, Hz → note + cents mapping
    ├── ui.ts               # DOM updates: note display, needle, cents readout
    └── style.css           # All styles
```

---

## Core Data Flow

```
[Start button click]
    → AudioContext.resume() (must be user gesture for browser policy)
    → getUserMedia({ audio: true })
    → MediaStreamSource → AnalyserNode (fftSize: 4096)

[requestAnimationFrame loop]
    → analyser.getFloatTimeDomainData(buffer)
    → rmsGate(buffer)          // skip if too quiet (noise floor)
    → YIN(buffer, sampleRate)  // → Hz or null
    → hzToNote(hz)             // → { note, octave, cents }
    → smooth(cents)            // rolling median, last 8 frames
    → updateUI({ note, cents })
```

---

## Key Implementation Details

### Note reference frequencies (standard tuning)
```ts
const STRING_NOTES = [
  { note: 'E', octave: 2, hz: 82.41 },
  { note: 'A', octave: 2, hz: 110.00 },
  { note: 'D', octave: 3, hz: 146.83 },
  { note: 'G', octave: 3, hz: 196.00 },
  { note: 'B', octave: 3, hz: 246.94 },
  { note: 'E', octave: 4, hz: 329.63 },
];
```

### Cents formula
```ts
// Find nearest semitone: A4 = 440Hz, 12 semitones per octave
const semitone = Math.round(12 * Math.log2(hz / 440)) + 57; // 57 = A4 MIDI
const nearestHz = 440 * Math.pow(2, (semitone - 57) / 12);
const cents = 1200 * Math.log2(hz / nearestHz); // -50 to +50
```

### Noise gate (RMS check)
```ts
function rms(buffer: Float32Array): number {
  return Math.sqrt(buffer.reduce((sum, x) => sum + x * x, 0) / buffer.length);
}
// Skip pitch detection if rms(buffer) < 0.01
```

### pitchfinder usage
```ts
import { YIN } from 'pitchfinder';
// Create detector once and reuse — do NOT recreate per frame
const detectPitch = YIN({ sampleRate: audioCtx.sampleRate });
const hz: number | null = detectPitch(buffer); // null if no pitch found
```

### AudioContext must start in a user gesture
```ts
// WRONG: const ctx = new AudioContext(); at module load
// RIGHT: create/resume inside button click handler
```

---

## UI Specification

```
┌─────────────────────────────────┐
│                                 │
│         [ START TUNING ]        │  ← button, becomes STOP when active
│                                 │
│              A                  │  ← current note, large (80px+)
│                                 │
│    ◄ ─────────|───────── ►      │  ← tuning needle / bar
│          -12 cents              │  ← numeric deviation
│                                 │
│  Color: red (>±20c) / yellow    │
│         (±5–20c) / green (±5c)  │
└─────────────────────────────────┘
```

- Needle is a CSS `transform: translateX()` on a track div, mapped from -50 to +50 cents → -100% to +100%
- Color transition via CSS `background-color` on the needle element
- Note text transitions with a brief CSS fade when it changes
- **Note persistence**: the last detected note stays displayed until either a new (different) note is detected, or 3 seconds elapse with no new note — then the display resets to `—`. The 3-second timer starts when a note is first detected and is only restarted when a different note is detected; frames continuing to detect the same note do not reset the timer.

---

## netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

---

## Implementation Phases

### Phase 1 — Project scaffold
```bash
mkdir guitar-tuner && cd guitar-tuner
npm create vite@latest . -- --template vanilla-ts
npm install pitchfinder
npm install --save-dev @types/pitchfinder  # if needed
```
- Delete boilerplate: `src/counter.ts`, `public/vite.svg`, `src/typescript.svg`
- Clear `src/main.ts` and `src/style.css`
- Add `netlify.toml`

### Phase 2 — Audio engine (`src/audio.ts`)
- Export `startListening(onFrame: (buffer: Float32Array) => void): Promise<() => void>`
- Returns a stop function
- Uses `getUserMedia` + `AudioContext` + `AnalyserNode` (fftSize 4096)
- Drives `requestAnimationFrame` loop, calls `onFrame` with each buffer

### Phase 3 — Pitch detection (`src/pitch.ts`)
- Export `detectPitch(buffer: Float32Array, sampleRate: number): number | null`
  - Returns null if RMS < noise threshold or YIN returns null
- Export `hzToNoteInfo(hz: number): { note: string; cents: number } | null`
  - Maps to nearest note across all 12 chromatic semitones (not just guitar strings)
  - Returns null if hz out of guitar range (70–400 Hz)
- Export `smoothCents(cents: number): number`
  - Rolling median, window of 8 frames

### Phase 4 — UI (`src/ui.ts` + `src/style.css`)
- Build HTML structure in `index.html`
- Export `updateDisplay(note: string | null, cents: number | null): void`
- Implement needle position + color logic
- Style: dark background, clean minimal tuner aesthetic

### Phase 5 — Wire up (`src/main.ts`)
- Import audio, pitch, ui modules
- Start button → start audio → on each frame: detect → smooth → display
- Stop button → call stop function from audio, reset UI

### Phase 6 — Test locally
```bash
npm run dev
```
- Open in browser, allow mic
- Test each string: E, A, D, G, B, e
- Test in quiet and noisy environment

### Phase 7 — Deploy to Netlify
```bash
npm run build
# then either:
git init && git add . && git commit -m "initial"
# push to GitHub, connect repo in Netlify dashboard
# OR: use Netlify CLI
npx netlify deploy --prod --dir=dist
```
- Verify HTTPS is active (required for mic)
- Test mic permission prompt works on deployed URL

---

## Gotchas to Watch For

1. **AudioContext autoplay policy** — create/resume only inside click handler. Chrome blocks it otherwise.
2. **fftSize must be power of 2** — use 4096. The YIN implementation in pitchfinder internally searches tau up to `bufferSize/4`, so with 2048 the minimum detectable frequency at 48kHz is ~94 Hz — too high for E2 (82.41 Hz) and F#2 (92.5 Hz). 4096 lowers the floor to ~47 Hz.
3. **pitchfinder returns null** — always null-check before using Hz value.
4. **Cents smoothing is important** — raw pitch jumps ±30 cents frame-to-frame on a held note. Without smoothing, needle is jittery and unreadable.
5. **Mobile Safari** — `AudioContext` constructor may need `webkitAudioContext` fallback. Not priority but worth a try-catch.
6. **HTTPS required** — `getUserMedia` is blocked on HTTP origins. Netlify auto-provides HTTPS, but `npm run dev` on localhost is fine without it.

---

## Out of Scope (do not implement unless asked)

- Alternate tunings (drop D, open G, etc.)
- Chromatic tuner mode (all 12 notes)
- Polyphonic detection (chords)
- Recording or playback
- Native mobile app
- User accounts or any backend
