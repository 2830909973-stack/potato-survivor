const memoryStore = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  try {
    const k = "__storage_test__";
    localStorage.setItem(k, k);
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

const lsAvailable = isLocalStorageAvailable();

export function safeGetItem(key: string): string | null {
  if (lsAvailable) {
    try {
      return localStorage.getItem(key);
    } catch {
      // fall through to memory
    }
  }
  return memoryStore.get(key) ?? null;
}

export function safeSetItem(key: string, value: string): void {
  if (lsAvailable) {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      // fall through to memory
    }
  }
  memoryStore.set(key, value);
}
