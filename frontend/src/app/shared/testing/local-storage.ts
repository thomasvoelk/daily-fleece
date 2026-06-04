export function mockLocalStorage(): void {
  const _store: Record<string, string> = {};
  const mock: Storage = {
    getItem: (k) => _store[k] ?? null,
    setItem: (k, v) => {
      _store[k] = v;
    },
    removeItem: (k) => {
      Reflect.deleteProperty(_store, k);
    },
    clear: () => {
      for (const k of Object.keys(_store)) Reflect.deleteProperty(_store, k);
    },
    key: (i) => Object.keys(_store)[i] ?? null,
    get length() {
      return Object.keys(_store).length;
    },
  };
  beforeAll(() => {
    vi.stubGlobal('localStorage', mock);
  });
  beforeEach(() => {
    mock.clear();
  });
}
