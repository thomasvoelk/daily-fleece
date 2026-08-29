import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  MaybeAsync,
  GuardResult,
  Router,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { hasPlayerIdGuard } from './host-setup.guard';
import { EntryContext } from '../entry';
import { HostSetupStore } from './host-setup.store';
import { provideTestEnvironment } from '../shared/testing';

function makeRoute(projectId: string, date: string): ActivatedRouteSnapshot {
  return {
    parent: { paramMap: convertToParamMap({ projectId, date }) },
  } as unknown as ActivatedRouteSnapshot;
}

describe('hasPlayerIdGuard', () => {
  let playerId: WritableSignal<string | null>;

  function runGuard(route?: ActivatedRouteSnapshot): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() =>
      hasPlayerIdGuard(route ?? makeRoute('default', '2026-06-12'), {} as never),
    );
  }

  beforeEach(() => {
    playerId = signal(null);
    TestBed.configureTestingModule({
      providers: [
        ...provideTestEnvironment(),
        provideRouter([]),
        HostSetupStore,
        { provide: EntryContext, useValue: { playerId } },
      ],
    });
  });

  it('redirects to / when playerId is null', () => {
    const result = runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('returns true when playerId is set', () => {
    playerId.set('p1');
    expect(runGuard()).toBe(true);
  });

  it('returns true when playerId is set and session is null (host creates the session)', () => {
    playerId.set('p1');
    expect(runGuard(makeRoute('default', '2026-06-12'))).toBe(true);
  });

  it('initializes HostSetupStore with projectId and date from parent route params', async () => {
    playerId.set('p1');
    await runGuard(makeRoute('default', '2026-06-12'));
    const store = TestBed.inject(HostSetupStore);
    expect(store.projectId()).toBe('default');
    expect(store.date()).toBe('2026-06-12');
  });

  it('falls back to "default" projectId and empty date when route has no parent', async () => {
    playerId.set('p1');
    const routeWithoutParent = { parent: null } as unknown as ActivatedRouteSnapshot;
    await runGuard(routeWithoutParent);
    const store = TestBed.inject(HostSetupStore);
    expect(store.projectId()).toBe('default');
    expect(store.date()).toBe('');
  });
});
