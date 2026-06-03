import { TestBed } from '@angular/core/testing';
import { MaybeAsync, GuardResult, Router, UrlTree, provideRouter } from '@angular/router';
import { HttpTestingController } from '@angular/common/http/testing';
import { lobbyGuard } from './lobby.guard';
import { LobbyStore } from './lobby.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResponse } from '../api';

mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), LobbyStore];

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
  function runGuard(): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() => lobbyGuard({} as never, {} as never));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
  });

  it('redirects to / when localStorage has no lobby-player entry', async () => {
    const result = await runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirects to / when playerId is null', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: null, companyId: 'acme', displayName: 'Alice' }),
    );
    const result = await runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirects to / when GET /sessions/today fails', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const http = TestBed.inject(HttpTestingController);

    const promise = runGuard() as Promise<GuardResult>;
    http
      .expectOne('/api/v1/sessions/today')
      .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    const result = await promise;

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('returns true and initializes the store when playerId is set and session exists', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const http = TestBed.inject(HttpTestingController);
    const store = TestBed.inject(LobbyStore);

    const promise = runGuard() as Promise<GuardResult>;
    http.expectOne('/api/v1/sessions/today').flush(makeSession('s1'));
    const result = await promise;

    expect(result).toBe(true);
    expect(store.session()?.sessionId).toBe('s1');
  });
});
