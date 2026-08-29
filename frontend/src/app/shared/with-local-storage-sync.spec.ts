import { TestBed } from '@angular/core/testing';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { withLocalStorageSync } from './with-local-storage-sync';
import { mockLocalStorage } from './testing';

mockLocalStorage();

interface TestState {
  a: string | null;
  b: string | null;
  transient: string | null;
}

const TestStore = signalStore(
  { providedIn: 'root' },
  withState<TestState>({ a: null, b: null, transient: null }),
  withLocalStorageSync({
    key: 'test-key',
    select: (state: TestState) => ({ a: state.a, b: state.b }),
  }),
  withMethods((store) => ({
    setAll(state: TestState) {
      patchState(store, state);
    },
  })),
);

describe('withLocalStorageSync', () => {
  it('restores selected state from localStorage on init', () => {
    localStorage.setItem('test-key', JSON.stringify({ a: 'stored-a', b: 'stored-b' }));
    TestBed.configureTestingModule({ providers: [TestStore] });

    const store = TestBed.inject(TestStore);

    expect(store.a()).toBe('stored-a');
    expect(store.b()).toBe('stored-b');
  });

  it('leaves state untouched when nothing is stored yet', () => {
    TestBed.configureTestingModule({ providers: [TestStore] });

    const store = TestBed.inject(TestStore);

    expect(store.a()).toBeNull();
    expect(store.b()).toBeNull();
  });

  it('writes only the selected slice to localStorage on every state change', () => {
    TestBed.configureTestingModule({ providers: [TestStore] });
    const store = TestBed.inject(TestStore);

    store.setAll({ a: 'new-a', b: 'new-b', transient: 'ignored' });

    const raw = localStorage.getItem('test-key');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '')).toEqual({ a: 'new-a', b: 'new-b' });
  });
});
