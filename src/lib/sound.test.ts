import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeAudioParam {
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class FakeOscillator {
  type = "";
  frequency = new FakeAudioParam();
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeGain {
  gain = new FakeAudioParam();
  connect = vi.fn();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  currentTime = 0;
  destination = {};
  oscillators: FakeOscillator[] = [];

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    return new FakeGain();
  }
}

// The audio context is cached at module level, so each test gets a fresh module.
async function loadModule() {
  vi.resetModules();
  return import("./sound");
}

beforeEach(() => {
  FakeAudioContext.instances = [];
  vi.stubGlobal("AudioContext", FakeAudioContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("playSound", () => {
  it("does nothing when sound is disabled", async () => {
    const { playSound } = await loadModule();
    playSound("tap", false);
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("plays a short sine tap", async () => {
    const { playSound } = await loadModule();
    playSound("tap", true);
    const [oscillator] = FakeAudioContext.instances[0].oscillators;
    expect(oscillator.type).toBe("sine");
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(320, 0);
    expect(oscillator.start).toHaveBeenCalled();
    expect(oscillator.stop).toHaveBeenCalled();
  });

  it("plays a three-note major triad on a correct answer", async () => {
    const { playSound } = await loadModule();
    playSound("correct", true);
    const { oscillators } = FakeAudioContext.instances[0];
    expect(oscillators).toHaveLength(3);
    expect(oscillators.every((o) => o.type === "triangle")).toBe(true);
  });

  it("plays a falling sawtooth on an error", async () => {
    const { playSound } = await loadModule();
    playSound("error", true);
    const [oscillator] = FakeAudioContext.instances[0].oscillators;
    expect(oscillator.type).toBe("sawtooth");
    expect(oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(110, 0.28);
  });

  it("reuses a single audio context across calls", async () => {
    const { playSound } = await loadModule();
    playSound("tap", true);
    playSound("correct", true);
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it("stays silent when the audio context cannot be created", async () => {
    vi.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          throw new Error("not allowed");
        }
      },
    );
    const { playSound } = await loadModule();
    expect(() => playSound("tap", true)).not.toThrow();
  });

  it("stays silent when audio nodes fail", async () => {
    vi.spyOn(FakeAudioContext.prototype, "createOscillator").mockImplementation(() => {
      throw new Error("audio graph error");
    });
    const { playSound } = await loadModule();
    expect(() => playSound("error", true)).not.toThrow();
  });

  it("does nothing outside the browser", async () => {
    vi.stubGlobal("window", undefined);
    const { playSound } = await loadModule();
    playSound("tap", true);
    expect(FakeAudioContext.instances).toHaveLength(0);
  });
});
