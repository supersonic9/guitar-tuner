import { YIN } from 'pitchfinder';

const NOISE_THRESHOLD = 0.01;
const GUITAR_HZ_MIN = 70;
const GUITAR_HZ_MAX = 400;
const SMOOTH_WINDOW = 8;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Rolling median buffer for cents smoothing
const centsHistory: number[] = [];

function rms(buffer: Float32Array): number {
  return Math.sqrt(buffer.reduce((sum, x) => sum + x * x, 0) / buffer.length);
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

let _detector: ((buffer: Float32Array) => number | null) | null = null;
let _detectorSampleRate = 0;

export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  if (rms(buffer) < NOISE_THRESHOLD) return null;
  if (!_detector || _detectorSampleRate !== sampleRate) {
    _detector = YIN({ sampleRate });
    _detectorSampleRate = sampleRate;
  }
  const hz = _detector(buffer);
  return hz ?? null;
}

export function hzToNoteInfo(hz: number): { note: string; cents: number } | null {
  if (hz < GUITAR_HZ_MIN || hz > GUITAR_HZ_MAX) return null;

  // A4 = 440 Hz, MIDI note 69
  const semitoneOffset = 12 * Math.log2(hz / 440);
  const semitone = Math.round(semitoneOffset);
  const nearestHz = 440 * Math.pow(2, semitone / 12);
  const cents = 1200 * Math.log2(hz / nearestHz);

  // MIDI note number: A4 = 69
  const midiNote = semitone + 69;
  const note = NOTE_NAMES[((midiNote % 12) + 12) % 12];

  return { note, cents };
}

export function smoothCents(cents: number): number {
  centsHistory.push(cents);
  if (centsHistory.length > SMOOTH_WINDOW) {
    centsHistory.shift();
  }
  return median(centsHistory);
}
