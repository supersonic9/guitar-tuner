const noteDisplay = document.getElementById('note-display') as HTMLDivElement;
const needle = document.getElementById('needle') as HTMLDivElement;
const centsDisplay = document.getElementById('cents-display') as HTMLDivElement;

let currentNote: string | null = null;

export function updateDisplay(note: string | null, cents: number | null): void {
  // Note display with fade transition on change
  if (note !== currentNote) {
    noteDisplay.classList.remove('fade-in');
    // Force reflow to restart animation
    void noteDisplay.offsetWidth;
    noteDisplay.textContent = note ?? '—';
    noteDisplay.classList.add('fade-in');
    currentNote = note;
  }

  if (cents === null || note === null) {
    needle.style.transform = 'translateX(0%)';
    needle.style.backgroundColor = 'var(--color-idle)';
    centsDisplay.textContent = '— cents';
    return;
  }

  // Clamp to ±50 cents range and map to ±100% translation
  const clamped = Math.max(-50, Math.min(50, cents));
  needle.style.transform = `translateX(${(clamped / 50) * 100}%)`;

  // Color by accuracy
  const abs = Math.abs(cents);
  if (abs <= 5) {
    needle.style.backgroundColor = 'var(--color-in-tune)';
  } else if (abs <= 20) {
    needle.style.backgroundColor = 'var(--color-close)';
  } else {
    needle.style.backgroundColor = 'var(--color-off)';
  }

  const sign = cents > 0 ? '+' : '';
  centsDisplay.textContent = `${sign}${Math.round(cents)} cents`;
}
