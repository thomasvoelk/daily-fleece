import { TestBed } from '@angular/core/testing';
import { MaybeAsync, GuardResult, Router, UrlTree, provideRouter } from '@angular/router';
import { hasPlayerIdGuard } from './host-setup.guard';
import { mockLocalStorage } from '../shared/testing';

mockLocalStorage();

describe('hasPlayerIdGuard', () => {
  function runGuard(): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() => hasPlayerIdGuard({} as never, {} as never));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('redirects to / when localStorage has no lobby-player entry', () => {
    const result = runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirects to / when playerId is null', () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: null, companyId: 'acme', displayName: 'Alice' }),
    );
    const result = runGuard();
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('returns true when playerId is set', () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    expect(runGuard()).toBe(true);
  });
});
