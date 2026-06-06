import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MaybeAsync, GuardResult, Router, UrlTree, provideRouter } from '@angular/router';
import { hasPlayerIdGuard } from './host-setup.guard';
import { EntryContext } from '../entry';

describe('hasPlayerIdGuard', () => {
  let playerId: WritableSignal<string | null>;

  function runGuard(): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() => hasPlayerIdGuard({} as never, {} as never));
  }

  beforeEach(() => {
    playerId = signal(null);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: EntryContext, useValue: { playerId } }],
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
});
