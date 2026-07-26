const KEY = "potato_settings";

export const DEFAULT_KEY_BINDINGS: Record<string, string> = {
  switch: "Q",
  reload: "R",
  grenade: "G",
  ability: "F",
  power1: "ONE",
  power2: "TWO",
  pause: "ESC",
};

interface SettingsData {
  bgmVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  keyBindings: Record<string, string>;
}

function load(): SettingsData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        bgmVolume: parsed.bgmVolume ?? 0.5,
        sfxVolume: parsed.sfxVolume ?? 0.5,
        screenShake: parsed.screenShake ?? true,
        keyBindings: { ...DEFAULT_KEY_BINDINGS, ...(parsed.keyBindings ?? {}) },
      };
    }
  } catch { /* ignore */ }
  return { bgmVolume: 0.5, sfxVolume: 0.5, screenShake: true, keyBindings: { ...DEFAULT_KEY_BINDINGS } };
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

  static getKeyBinding(action: string): string {
    return Settings.data.keyBindings[action] ?? DEFAULT_KEY_BINDINGS[action] ?? "";
  }

  static setKeyBinding(action: string, key: string) {
    Settings.data.keyBindings[action] = key;
    save(Settings.data);
  }

  static getAllBindings(): Record<string, string> {
    return { ...Settings.data.keyBindings };
  }

  static resetKeyBindings() {
    Settings.data.keyBindings = { ...DEFAULT_KEY_BINDINGS };
    save(Settings.data);
  }
}
