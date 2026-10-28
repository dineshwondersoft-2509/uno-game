import type { SfxEvent } from "../engine/types";

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    audioCtx = new AudioCtor();
  }
  return audioCtx;
}

export function playSfx(type: SfxEvent): void {
  if (!soundEnabled) return;
  const ctx = context();
  if (!ctx) return;
  void ctx.resume();

  if (type === "play") beep(ctx, 420, 0.07, "square");
  if (type === "draw") beep(ctx, 240, 0.08, "triangle");
  if (type === "action") {
    beep(ctx, 360, 0.06, "square");
    beep(ctx, 520, 0.08, "square", 0.07);
  }
  if (type === "uno") {
    beep(ctx, 520, 0.11, "sawtooth");
    beep(ctx, 740, 0.16, "sawtooth", 0.07);
    beep(ctx, 880, 0.12, "square", 0.14);
  }
  if (type === "win") {
    beep(ctx, 392, 0.1, "triangle");
    beep(ctx, 494, 0.1, "triangle", 0.1);
    beep(ctx, 587, 0.16, "triangle", 0.2);
  }
  if (type === "challenge") {
    beep(ctx, 180, 0.1, "square");
    beep(ctx, 280, 0.12, "square", 0.08);
  }
}

function beep(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType,
  delay = 0,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.02);
}
