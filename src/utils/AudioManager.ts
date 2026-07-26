import { Settings } from "./Settings";

export class AudioManager {
  private static ctx: AudioContext | null = null;
  private static sfxGain: GainNode | null = null;
  private static bgmInterval: ReturnType<typeof setInterval> | null = null;
  private static bgmGain: GainNode | null = null;
  private static currentBgmVolume = 0.5;
  private static initialized = false;

  static init() {
    if (this.initialized) return;
    this.initialized = true;
    this.ensure();
  }

  private static ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = Settings.sfxVolume * 0.3;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  static setSfxVolume(v: number) {
    if (!this.initialized) return;
    if (this.sfxGain) this.sfxGain.gain.value = v * 0.3;
  }

  static setBgmVolume(v: number) {
    this.currentBgmVolume = v;
    if (this.bgmGain) this.bgmGain.gain.value = v * 0.08;
  }

  static applySettings() {
    this.setSfxVolume(Settings.sfxVolume);
    this.setBgmVolume(Settings.bgmVolume);
  }

  private static tone(freq: number, duration: number, type: OscillatorType = "square", delay = 0) {
    if (Settings.sfxVolume <= 0) return;
    if (!this.initialized) return;
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.5, this.ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
  }

  static startBGM() {
    if (Settings.bgmVolume <= 0) return;
    if (!this.initialized) return;
    if (!this.ctx || this.bgmInterval) return;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = this.currentBgmVolume * 0.08;
    this.bgmGain.connect(this.ctx.destination);

    const bassNotes = [130.81, 146.83, 164.81, 174.61, 196, 220, 246.94, 261.63];
    let bassIdx = 0;
    this.bgmInterval = setInterval(() => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = bassNotes[bassIdx % bassNotes.length];
      bassIdx++;
      g.gain.setValueAtTime(0.3, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(g);
      g.connect(this.bgmGain);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.5);
    }, 800);
  }

  static stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  static shoot() { this.tone(800, 0.05, "square"); }
  static kill() { this.tone(400, 0.08, "sine"); }
  static pickup() { this.tone(600, 0.1, "sine"); }
  static levelUp() {
    this.tone(400, 0.12, "sine");
    this.tone(500, 0.12, "sine", 0.12);
    this.tone(600, 0.15, "sine", 0.24);
  }
  static bossWarning() { this.tone(100, 0.4, "sawtooth"); }
  static explosion() { this.tone(80, 0.3, "sawtooth"); }
  static evolve() {
    this.tone(500, 0.1, "sine");
    this.tone(600, 0.1, "sine", 0.1);
    this.tone(800, 0.1, "sine", 0.2);
    this.tone(1000, 0.2, "sine", 0.3);
  }
  static hit() { this.tone(200, 0.06, "square"); }
  static switchWeapon() {
    this.tone(600, 0.04, "square");
    this.tone(800, 0.04, "square", 0.04);
  }
}
