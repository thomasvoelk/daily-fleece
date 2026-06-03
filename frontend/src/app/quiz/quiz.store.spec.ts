import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { QuizStore } from './quiz.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResponse } from '../api';

mockLocalStorage();

const drainMicrotasks = () => new Promise<void>((r) => queueMicrotask(r));

@Component({ template: '' })
class LobbyStub {}

const PROVIDERS = [
  ...provideTestEnvironment(),
  provideRouter([{ path: 'lobby', component: LobbyStub }]),
  QuizStore,
];

function makeSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    sessionId: 's1',
    date: '2026-06-02',
    hostId: 'host-1',
    phase: 'Active',
    projectId: 'default',
    players: [],
    voting: { q1: { status: 'Open' }, q2: { status: 'Open' } },
    ...overrides,
  };
}

// ─── submitQ1Answer ──────────────────────────────────────────────────────────

describe('QuizStore – submitQ1Answer', () => {
  it('PUTs answer to the correct endpoint', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    const loadPromise = store.refresh();
    http.expectOne('/api/v1/sessions/today').flush(makeSession({ sessionId: 's42' }));
    await loadPromise;

    // don't await — flush both requests synchronously then await
    const submitPromise = store.submitQ1Answer('C');
    const req = http.expectOne('/api/v1/sessions/s42/questions/q1/answers');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toMatchObject({ playerId: 'player-1', answer: 'C' });
    req.flush('');
    await drainMicrotasks();
    // backend returns answers: null while voting is Open — local state tracks the player's own answer
    http.expectOne('/api/v1/sessions/today').flush(makeSession({ sessionId: 's42' }));
    await submitPromise;

    expect(store.myQ1Answer()).toBe('C');
  });
});

// ─── setQ1CorrectAnswer ───────────────────────────────────────────────────────

describe('QuizStore – setQ1CorrectAnswer', () => {
  it('POSTs correct answer and updates session from response', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Host' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    const loadPromise = store.refresh();
    http
      .expectOne('/api/v1/sessions/today')
      .flush(makeSession({ sessionId: 's42', hostId: 'host-1' }));
    await loadPromise;

    const closePromise = store.setQ1CorrectAnswer('A');
    const req = http.expectOne('/api/v1/sessions/s42/questions/q1/correct');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ hostId: 'host-1', correctAnswer: 'A' });
    req.flush(
      makeSession({
        sessionId: 's42',
        voting: { q1: { status: 'Closed', correctAnswer: 'A' }, q2: { status: 'Open' } },
      }),
    );
    await closePromise;

    expect(store.q1Status()).toBe('Closed');
  });
});

// ─── computed signals ────────────────────────────────────────────────────────

describe('QuizStore – computed signals', () => {
  it('q1Status reflects session voting status', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    const promise = store.refresh();
    http
      .expectOne('/api/v1/sessions/today')
      .flush(makeSession({ voting: { q1: { status: 'Closed' }, q2: { status: 'Open' } } }));
    await promise;

    expect(store.q1Status()).toBe('Closed');
  });

  it('isHost is true when player is the session host', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/today').flush(makeSession({ hostId: 'host-1' }));
    await promise;

    expect(store.isHost()).toBe(true);
  });

  it('isHost is false when player is not the host', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-2', companyId: 'acme', displayName: 'Bob' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/today').flush(makeSession({ hostId: 'host-1' }));
    await promise;

    expect(store.isHost()).toBe(false);
  });

  it('myQ1Answer returns the current player answer', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/today').flush(
      makeSession({
        voting: {
          q1: { status: 'Open', answers: { 'player-1': { answer: 'B', displayName: 'Alice' } } },
          q2: { status: 'Open' },
        },
      }),
    );
    await promise;

    expect(store.myQ1Answer()).toBe('B');
  });

  it('myQ1Answer returns null when player has not answered', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/today').flush(makeSession());
    await promise;

    expect(store.myQ1Answer()).toBeNull();
  });

  it('answerCount reflects how many players have answered', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/today').flush(
      makeSession({
        players: [
          { playerId: 'p1', displayName: 'Alice' },
          { playerId: 'p2', displayName: 'Bob' },
          { playerId: 'p3', displayName: 'Carl' },
        ],
        voting: {
          q1: { status: 'Open', answerCount: 2 },
          q2: { status: 'Open' },
        },
      }),
    );
    await promise;

    expect(store.answerCount()).toEqual({ answered: 2, total: 3 });
  });
});

// ─── refresh ─────────────────────────────────────────────────────────────────

describe('QuizStore – refresh', () => {
  it('updates session without redirecting when phase is not Active', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const promise = store.refresh();
    http
      .expectOne('/api/v1/sessions/today')
      .flush(makeSession({ phase: 'Lobby', sessionId: 'r1' }));
    await promise;

    expect(store.session()?.sessionId).toBe('r1');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

// ─── loadSession ─────────────────────────────────────────────────────────────

describe('QuizStore – loadSession', () => {
  it('stores the fetched session in state', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    const promise = store.loadSession();
    http.expectOne('/api/v1/sessions/today').flush(makeSession({ sessionId: 'abc' }));
    await promise;

    expect(store.session()?.sessionId).toBe('abc');
  });

  it('redirects to /lobby when session is not Active', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const promise = store.loadSession();
    http.expectOne('/api/v1/sessions/today').flush(makeSession({ phase: 'Lobby' }));
    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/lobby']);
  });
});
