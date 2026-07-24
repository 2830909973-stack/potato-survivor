const KEY = "potato_settings";

interface SettingsData {
  bgmVolume: number;
  sfxVolume: number;
  screenShake: boolean;
}

function load(): SettingsData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { bgmVolume: 0.5, sfxVolume: 0.5, screenShake: true };
}

function save(data: SettingsData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export class Settings {
  private static data = load();

  static get bgmVolume(): number { return Settings.data.bgmVolume; }
  static set bgmVolume(v: number) { Settings.data.bgmVolume = Math.max(0, Math.min(1, v)); save(Settings.data); }
  static get sfxVolume(): number { return Settings.data.sfxVolume; }
  static set sfxVolume(v: number) { Settings.data.sfxVolume = Math.max(0, Math.min(1, v)); save(Settings.data); }
  static get screenShake(): boolean { return Settings.data.screenShake; }
  static set screenShake(v: boolean) { Settings.data.screenShake = v; save(Settings.data); }
}
