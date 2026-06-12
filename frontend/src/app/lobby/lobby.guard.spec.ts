import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MaybeAsync, GuardResult, Router, UrlTree, provideRouter } from '@angular/router';
import { HttpTestingController } from '@angular/common/http/testing';
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

describe('lobbyGuard', () => {
  let playerId: WritableSignal<string | null>;

  function runGuard(): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() => lobbyGuard({} as never, {} as never));
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

  it('redirects to / when GET /sessions/default/{date} fails', async () => {
    playerId.set('p1');
    const http = TestBed.inject(HttpTestingController);
    const today = '2026-06-12';

    const promise = runGuard() as Promise<GuardResult>;
    http
      .expectOne(`/api/v1/sessions/default/${today}`)
      .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    const result = await promise;

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('returns true and initializes the store when playerId is set and session exists', async () => {
    playerId.set('p1');
    const http = TestBed.inject(HttpTestingController);
    const store = TestBed.inject(LobbyStore);
    const today = '2026-06-12';

    const promise = runGuard() as Promise<GuardResult>;
    http.expectOne(`/api/v1/sessions/default/${today}`).flush(makeSession('s1'));
    const result = await promise;

    expect(result).toBe(true);
    expect(store.session()?.sessionId).toBe('s1');
  });
});
