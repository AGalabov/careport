const PREFIX = 'careport_';

export class SessionStorageService<T extends string = string> {
  private readonly storageKey: string;

  constructor(key: string) {
    this.storageKey = key;
  }

  get data(): T | undefined {
    try {
      const raw = sessionStorage.getItem(PREFIX + this.storageKey);
      if (raw == null || raw === '') return undefined;
      return raw as T;
    } catch {
      return undefined;
    }
  }

  save(value: T): void {
    try {
      sessionStorage.setItem(PREFIX + this.storageKey, value);
    } catch {
      // Quota or private mode — ignore
    }
  }
}
