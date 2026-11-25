const STORAGE_KEY = "sertos_sound_muted";

export type SoundEffect = "tick" | "alert" | "success" | "error";

let muted = readMuted();
let audioContext: AudioContext | null = null;

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function isSoundMuted(): boolean {
  return muted;
}

export function setSoundMuted(nextMuted: boolean): void {
  muted = nextMuted;
  try {
    localStorage.setItem(STORAGE_KEY, String(nextMuted));
  } catch {
    // Audio controls remain usable if browser storage is unavailable.
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextConstructor = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

export async function unlockAudio(): Promise<boolean> {
  const context = getAudioContext();
  if (!context) return false;
  try {
    if (context.state === "suspended") await context.resume();
    return context.state === "running";
  } catch {
    return false;
  }
}

function playTone(
  context: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number,
  waveform: OscillatorType = "sine",
): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(envelope);
  envelope.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

export function playSound(effect: SoundEffect): void {
  if (muted) return;
  const context = getAudioContext();
  if (!context) return;

  const schedule = () => {
    if (muted || context.state !== "running") return;
    const now = context.currentTime + 0.015;
    if (effect === "tick") {
      playTone(context, 920, now, 0.035, 0.025, "triangle");
    } else if (effect === "alert") {
      playTone(context, 740, now, 0.11, 0.04);
      playTone(context, 990, now + 0.12, 0.13, 0.04);
    } else if (effect === "success") {
      playTone(context, 523.25, now, 0.11, 0.035);
      playTone(context, 659.25, now + 0.1, 0.11, 0.035);
      playTone(context, 783.99, now + 0.2, 0.16, 0.04);
    } else {
      playTone(context, 196, now, 0.18, 0.045, "triangle");
      playTone(context, 146.83, now + 0.12, 0.2, 0.04, "triangle");
    }
  };

  if (context.state === "suspended") {
    void context.resume().then(schedule).catch(() => undefined);
  } else {
    schedule();
  }
}
