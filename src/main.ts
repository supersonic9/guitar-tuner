import './style.css';
import { startListening } from './audio';
import { detectPitch, hzToNoteInfo, smoothCents } from './pitch';
import { updateDisplay } from './ui';

const btn = document.getElementById('btn-toggle') as HTMLButtonElement;

let stopAudio: (() => void) | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;
let lastNote: string | null = null;

function startClearTimer() {
  if (clearTimer) return; // already running, let it fire
  clearTimer = setTimeout(() => {
    updateDisplay(null, null);
    lastNote = null;
    clearTimer = null;
  }, 3000);
}

function cancelClearTimer() {
  if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
}

btn.addEventListener('click', async () => {
  if (stopAudio) {
    stopAudio();
    stopAudio = null;
    cancelClearTimer();
    lastNote = null;
    btn.textContent = 'Start Tuning';
    updateDisplay(null, null);
    return;
  }

  btn.textContent = 'Stop';
  btn.disabled = true;

  try {
    stopAudio = await startListening((buffer, sampleRate) => {
      const hz = detectPitch(buffer, sampleRate);
      if (hz === null) {
        startClearTimer();
        return;
      }

      const info = hzToNoteInfo(hz);
      if (info === null) {
        startClearTimer();
        return;
      }

      const smoothed = smoothCents(info.cents);
      updateDisplay(info.note, smoothed);

      if (info.note !== lastNote) {
        // New note detected — cancel any pending reset and start a fresh timer
        cancelClearTimer();
        lastNote = info.note;
      }
      startClearTimer();
    });
  } catch (err) {
    console.error('Mic access failed:', err);
    btn.textContent = 'Start Tuning';
    stopAudio = null;
  } finally {
    btn.disabled = false;
  }
});
