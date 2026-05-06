/** Minimal sessionStorage helper for persisting simple string values (e.g. locale). */
export class SessionStorageService<T extends string> {
  private readonly storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  get data(): T | undefined {
    if (typeof sessionStorage === 'undefined') return undefined;
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (raw === null) return undefined;
      return raw as T;
    } catch {
      return undefined;
    }
  }

  save(value: T): void {
    sessionStorage.setItem(this.storageKey, value);
  }
}
