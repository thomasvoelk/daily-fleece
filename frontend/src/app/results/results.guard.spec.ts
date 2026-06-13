import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  MaybeAsync,
  GuardResult,
  Router,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { resultsGuard } from './results.guard';
import { ResultsStore } from './results.store';
import { EntryContext } from '../entry';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResponse } from '../backend-client';

mockLocalStorage();

function makeSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    sessionId: 's1',
    date: '2026-06-12',
    hostId: 'host-1',
    phase: 'Ended',
    projectId: 'default',
    players: [],
    voting: { q1: { status: 'Closed' }, q2: { status: 'Closed' } },
    ...overrides,
  };
}

function makeRoute(session: SessionResponse | null): ActivatedRouteSnapshot {
  return { data: { session }, url: [{ path: 'results' }] } as unknown as ActivatedRouteSnapshot;
}

describe('resultsGuard', () => {
  let playerId: WritableSignal<string | null>;

  function runGuard(session: SessionResponse | null = makeSession()): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() => resultsGuard(makeRoute(session), {} as never));
  }

  beforeEach(() => {
    playerId = signal(null);
    TestBed.configureTestingModule({
      providers: [
        ...provideTestEnvironment(),
        provideRouter([]),
        ResultsStore,
        { provide: EntryContext, useValue: { playerId } },
      ],
    });
  });

  it('redirects to / when session is null', async () => {
    const result = await runGuard(null);
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirects to / when Active session and no identity', async () => {
    const result = await runGuard(makeSession({ phase: 'Active' }));
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('allows and seeds the store when Active session with identity', async () => {
    playerId.set('p1');
    const session = makeSession({ phase: 'Active' });
    const result = await runGuard(session);
    expect(result).toBe(true);
    expect(TestBed.inject(ResultsStore).session()).toEqual(session);
  });

  it('allows and seeds the store when Ended session without identity', async () => {
    const session = makeSession({ phase: 'Ended' });
    const result = await runGuard(session);
    expect(result).toBe(true);
    expect(TestBed.inject(ResultsStore).session()).toEqual(session);
  });

  it('allows and seeds the store when Ended session with identity', async () => {
    playerId.set('p1');
    const session = makeSession({ phase: 'Ended' });
    const result = await runGuard(session);
    expect(result).toBe(true);
    expect(TestBed.inject(ResultsStore).session()).toEqual(session);
  });

  it('redirects to / when Lobby session and no identity', async () => {
    const result = await runGuard(makeSession({ phase: 'Lobby' }));
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirects to lobby when Lobby session with identity', async () => {
    playerId.set('p1');
    const result = await runGuard(
      makeSession({ phase: 'Lobby', projectId: 'default', date: '2026-06-12' }),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/session/default/2026-06-12/lobby',
    );
  });
});
