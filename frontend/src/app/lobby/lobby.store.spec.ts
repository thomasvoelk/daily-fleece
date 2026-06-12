import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { LobbyStore } from './lobby.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResponse } from '../backend-client';

mockLocalStorage();

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class QuizStub {}

const PROVIDERS = [
  ...provideTestEnvironment(),
  provideRouter([{ path: 'quiz', component: QuizStub }]),
  LobbyStore,
];

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

// ─── goToQuiz ────────────────────────────────────────────────────────────────

describe('LobbyStore – goToQuiz', () => {
  it('does nothing when no session is in state', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);

    await store.goToQuiz();

    http.verify();
  });

  it('navigates to /quiz when fetched session is Active', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(makeSession({ phase: 'Lobby' }));

    const promise = store.goToQuiz();
    http.expectOne('/api/v1/sessions/default/2026-05-31').flush(makeSession({ phase: 'Active' }));
    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/quiz']);
  });

  it('sets error when session is still in Lobby phase', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(makeSession({ phase: 'Lobby' }));

    const promise = store.goToQuiz();
    http.expectOne('/api/v1/sessions/default/2026-05-31').flush(makeSession({ phase: 'Lobby' }));
    await promise;

    expect(store.error()).toBe('Quiz noch nicht gestartet. Bitte warten.');
    expect(navigateSpy).not.toHaveBeenCalled();
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
  it('does nothing when no session is in state', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);

    await store.startQuiz();

    http.verify();
  });

  it('does nothing when no player identity is available', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());

    await store.startQuiz();

    http.verify();
  });

  it('calls POST /sessions/default/{date}/start with the current player as hostId', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession({ hostId: 'host-1' }));

    const promise = store.startQuiz();
    const req = http.expectOne('/api/v1/sessions/default/2026-05-31/start');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ hostId: 'host-1' });
    req.flush(makeSession({ phase: 'Active' }));
    await promise;
  });

  it('navigates to /quiz on success', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(makeSession({ hostId: 'host-1' }));

    const promise = store.startQuiz();
    http
      .expectOne('/api/v1/sessions/default/2026-05-31/start')
      .flush(makeSession({ phase: 'Active' }));
    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/quiz']);
  });
});
