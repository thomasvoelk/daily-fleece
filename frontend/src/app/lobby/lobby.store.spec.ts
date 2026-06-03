import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { LobbyStore } from './lobby.store';
import { EntryStore } from '../entry';
import { provideTestEnvironment } from '../../testing/providers';
import { mockLocalStorage } from '../../testing/local-storage';
import { SessionResponse } from '../api/models';

mockLocalStorage();

@Component({ template: '' })
class QuizStub {}

const PROVIDERS = [
  ...provideTestEnvironment(),
  provideRouter([{ path: 'quiz', component: QuizStub }]),
  EntryStore,
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
  it('navigates to /quiz when fetched session is Active', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(makeSession({ phase: 'Lobby' }));

    const promise = store.goToQuiz();
    http.expectOne('/api/v1/sessions/today').flush(makeSession({ phase: 'Active' }));
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
    http.expectOne('/api/v1/sessions/today').flush(makeSession({ phase: 'Lobby' }));
    await promise;

    expect(store.error()).toMatch(/not started/i);
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

    store.initializeSession(makeSession({ sessionId: 's42', hostId: 'host-1' }));

    const promise = store.startQuiz();
    http.expectOne('/api/v1/sessions/s42/start').flush(makeSession({ phase: 'Active' }));
    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/quiz']);
  });
});
