const noteDisplay = document.getElementById('note-display') as HTMLDivElement;
const needle = document.getElementById('bar-needle') as HTMLDivElement;
const centsDisplay = document.getElementById('cents-display') as HTMLDivElement;
const root = document.documentElement;

let currentNote: string | null = null;

function setAccent(color: string, glow: string): void {
  root.style.setProperty('--accent', color);
  root.style.setProperty('--accent-glow', glow);
}

export function updateDisplay(note: string | null, cents: number | null): void {
  if (note !== currentNote) {
    noteDisplay.classList.remove('fade-in');
    void noteDisplay.offsetWidth;
    noteDisplay.textContent = note ?? '—';
    noteDisplay.classList.add('fade-in');
    currentNote = note;
  }

  if (cents === null || note === null) {
    needle.style.left = '50%';
    setAccent('#444', 'rgba(68,68,68,0.3)');
    centsDisplay.textContent = '—';
    return;
  }

  // Map -50..+50 cents to 0%..100% bar position
  const clamped = Math.max(-50, Math.min(50, cents));
  const pct = ((clamped + 50) / 100) * 100;
  needle.style.left = `${pct}%`;

  const abs = Math.abs(cents);
  if (abs <= 5) {
    setAccent('#00e5ff', 'rgba(0,229,255,0.45)');
  } else if (abs <= 20) {
    setAccent('#ffab00', 'rgba(255,171,0,0.45)');
  } else {
    setAccent('#ff1744', 'rgba(255,23,68,0.45)');
  }

  const sign = cents > 0 ? '+' : '';
  centsDisplay.textContent = `${sign}${Math.round(cents)} ¢`;
}
