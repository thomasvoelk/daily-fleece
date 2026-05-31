import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LobbyStore } from './lobby.store';
import { EntryStore } from '../entry/entry.store';
import { provideTestEnvironment } from '../../testing/providers';
import { mockLocalStorage } from '../../testing/local-storage';
import { SessionResponse } from '../api/models';

mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), EntryStore, LobbyStore];

function makeSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    sessionId: 's1',
    date: '2026-05-31',
    hostId: 'host-1',
    phase: 'Lobby',
    projectId: 'default',
    players: [],
    voting: { q1: { status: 'Open' }, q2: { status: 'Open' } },
    ...overrides,
  };
}

// ─── refresh ─────────────────────────────────────────────────────────────────

describe('LobbyStore – refresh', () => {
  it('updates session on success', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession({ players: [{ playerId: 'p1', displayName: 'Alice' }] }));

    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/today').flush(
      makeSession({
        players: [
          { playerId: 'p1', displayName: 'Alice' },
          { playerId: 'p2', displayName: 'Bob' },
        ],
      }),
    );
    await promise;

    expect(store.session()?.players).toHaveLength(2);
  });

  it('sets refreshError on failure without clearing the session', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession({ players: [{ playerId: 'p1', displayName: 'Alice' }] }));

    const promise = store.refresh();
    http
      .expectOne('/api/v1/sessions/today')
      .flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });
    await promise;

    expect(store.refreshError()).toMatch(/refresh failed/i);
    expect(store.session()?.players).toHaveLength(1);
  });
});

// ─── isHost ──────────────────────────────────────────────────────────────────

describe('LobbyStore – isHost', () => {
  it('is true when session hostId matches the current player', () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);

    store.initializeSession(makeSession({ hostId: 'host-1' }));

    expect(store.isHost()).toBe(true);
  });

  it('is false when session hostId differs from the current player', () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-2', companyId: 'acme', displayName: 'Bob' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);

    store.initializeSession(makeSession({ hostId: 'host-1' }));

    expect(store.isHost()).toBe(false);
  });
});

// ─── startQuiz ───────────────────────────────────────────────────────────────

describe('LobbyStore – startQuiz', () => {
  it('calls POST /sessions/{id}/start with the current player as hostId', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession({ sessionId: 's42', hostId: 'host-1' }));

    const promise = store.startQuiz();
    const req = http.expectOne('/api/v1/sessions/s42/start');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ hostId: 'host-1' });
    req.flush(makeSession({ sessionId: 's42', phase: 'Active' }));
    await promise;
  });
});
