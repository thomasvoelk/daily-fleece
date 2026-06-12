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
import { lobbyGuard } from './lobby.guard';
import { LobbyStore } from './lobby.store';
import { EntryContext } from '../entry';
import { provideTestEnvironment } from '../shared/testing';
import { SessionResponse } from '../backend-client';

function makeSession(sessionId = 's1'): SessionResponse {
  return {
    sessionId,
    date: '2026-05-31',
    hostId: 'host-1',
    phase: 'Lobby',
    projectId: 'default',
    players: [],
    voting: { q1: { status: 'Open' }, q2: { status: 'Open' } },
  };
}

function makeRoute(session: SessionResponse | null): ActivatedRouteSnapshot {
  return { data: { session } } as unknown as ActivatedRouteSnapshot;
}

describe('lobbyGuard', () => {
  let playerId: WritableSignal<string | null>;

  function runGuard(session: SessionResponse | null = makeSession()): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() => lobbyGuard(makeRoute(session), {} as never));
  }

  beforeEach(() => {
    playerId = signal(null);
    TestBed.configureTestingModule({
      providers: [
        ...provideTestEnvironment(),
        provideRouter([]),
        LobbyStore,
        { provide: EntryContext, useValue: { playerId } },
      ],
    });
  });

  it('redirects to / when playerId is null', async () => {
    const result = await runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirects to / when resolved session is null', async () => {
    playerId.set('p1');
    const result = await runGuard(null);
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('returns true and initializes the store when playerId is set and session is resolved', async () => {
    playerId.set('p1');
    const store = TestBed.inject(LobbyStore);

    const result = await runGuard(makeSession('s1'));

    expect(result).toBe(true);
    expect(store.session()?.sessionId).toBe('s1');
  });
});
