# Guitar Tuner — Design Options

Three visual design concepts explored for the Tuna guitar tuner. **Option A** was chosen and implemented.

---

## Option A — Vintage VU Meter (SELECTED)

A warm, analog aesthetic inspired by 1960s–70s broadcast equipment and hardware test meters.

**Palette:** Warm cream/ivory dial face (`#f5f0e8`), aged brass border (`#8b7355`), very dark charcoal background (`#1a1410`), deep red needle (`#c0392b`).

**Key elements:**
- Circular dial face with inset + drop shadows to simulate depth
- SVG semicircular arc (210° → 330°, 120° total sweep) divided into red/yellow/green/yellow/red zones
- 11 radial tick marks at every 10¢ (−50 to +50¢); centre tick longer
- CSS div needle rotating ±60° around its base pivot
- Large serif note letter (Georgia) centred in the lower dial half
- Pill-shaped toggle button with "press depth" via box-shadow

**CSS/JS techniques:**
- `transform: rotate(Xdeg)` with `transform-origin: 50% 100%` for needle pivot
- SVG `<path>` arcs with `stroke` (no fill) for zone bands
- SVG `<line>` elements with `transform` for tick marks
- `box-shadow: inset ...` for dial face depth
- `border-radius: 50%` + `overflow: hidden` for circular clipping

---

## Option B — Dark Chromatic (not implemented)

A high-contrast dark-on-dark UI with neon accent highlights, evoking a digital oscilloscope or studio plugin.

**Palette:** Near-black background (`#0d0d0d`), dark grey surface (`#1a1a1a`), electric cyan in-tune (`#00e5ff`), hot red off (`#ff1744`), amber close (`#ffab00`).

**Key elements:**
- Flat dark horizontal bar tuner (keep existing layout, just restyle)
- Glowing neon needle (box-shadow blur in accent colour)
- Monospace font (JetBrains Mono, Fira Code, or `font-family: monospace`)
- Note name rendered in large monospace — looks like a terminal readout
- Subtle scanline overlay via repeating CSS gradient

**CSS/JS techniques:**
- `box-shadow: 0 0 12px var(--accent)` for glow effects
- `background: repeating-linear-gradient(...)` scanline texture
- `text-shadow` for glowing note display
- No SVG needed — keep flat bar with enhanced styling
- Colour transitions on needle and bar borders driven by cents value

---

## Option C — Minimal Floating (not implemented)

Ultra-clean, almost invisible UI — white space dominant, single elegant accent, inspired by Swiss graphic design.

**Palette:** Off-white background (`#fafafa`), nearly-black text (`#111`), single accent for in-tune state (`#2563eb` blue or `#059669` green), light grey inactive.

**Key elements:**
- Large note name dominates — fills most of the screen
- Thin arc indicator (1–2px stroke, no fill) below the note
- Micro cents readout in light grey
- Button is text-only (no border/background), just an underline on hover
- Generous whitespace; no card or panel chrome

**CSS/JS techniques:**
- Full-page background is the "dial" — note changes bg tint when in tune
- Arc via SVG path, extremely thin stroke, very subtle
- `font-variant-numeric: tabular-nums` for smooth cents readout
- CSS custom property `--tint` toggled by JS class for bg colour shift
- `transition: background-color 0.3s` on body for ambient feedback
