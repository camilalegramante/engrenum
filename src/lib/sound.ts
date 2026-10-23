// Sound effects synthesized with the Web Audio API (no audio files).
export type SoundEffect = "tap" | "correct" | "error";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioContext;
}

function playTone(
  ctx: AudioContext,
  type: OscillatorType,
  frequency: number,
  start: number,
  end: number,
  volume: number,
): OscillatorNode {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, end);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end);
  return oscillator;
}

export function playSound(effect: SoundEffect, isEnabled: boolean): void {
  if (!isEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    if (effect === "tap") {
      playTone(ctx, "sine", 320, now, now + 0.04, 0.04);
    } else if (effect === "correct") {
      // Major triad: F4 → A4 → C5
      [349.23, 440, 523.25].forEach((frequency, i) =>
        playTone(ctx, "triangle", frequency, now + i * 0.08, now + 0.5, 0.12),
      );
    } else {
      const oscillator = playTone(ctx, "sawtooth", 180, now, now + 0.28, 0.12);
      oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.28);
    }
  } catch {
    // Audio unavailable: carry on silently.
  }
}
