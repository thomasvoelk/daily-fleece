import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { QuizStore } from './quiz.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResponse } from '../backend-client';

mockLocalStorage();

const drainMicrotasks = () =>
  new Promise<void>((r) => {
    queueMicrotask(r);
  });

@Component({
  selector: 'app-lobby-stub',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LobbyStub {}

@Component({
  selector: 'app-results-stub',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ResultsStub {}

@Component({
  selector: 'app-quiz-stub',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class QuizStub {}

const PROVIDERS = [
  ...provideTestEnvironment(),
  provideRouter([
    {
      path: 'session/:projectId/:date',
      children: [
        { path: 'lobby', component: LobbyStub },
        { path: 'results', component: ResultsStub },
        { path: 'q1', component: QuizStub },
        { path: 'q2', component: QuizStub },
      ],
    },
  ]),
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

// ─── initial state ───────────────────────────────────────────────────────────

describe('QuizStore – initial state', () => {
  it('answerCount and q2AnswerCount return zeros before session loads', () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    expect(store.answerCount()).toEqual({ answered: 0, total: 0 });
    expect(store.q2AnswerCount()).toEqual({ answered: 0, total: 0 });
  });
});

// ─── no-op guards when session is null ───────────────────────────────────────

describe('QuizStore – no-op guards with no session', () => {
  it('submitQ1Answer does nothing when session is null', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    await store.submitQ1Answer('A');
    http.verify();
  });

  it('submitQ2Answer does nothing when session is null', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    await store.submitQ2Answer('DE');
    http.verify();
  });

  it('setQ1CorrectAnswer does nothing when session is null', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    await store.setQ1CorrectAnswer('A');
    http.verify();
  });

  it('setQ2CorrectAnswer does nothing when session is null', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    await store.setQ2CorrectAnswer('DE');
    http.verify();
  });
});

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

    store.initializeSession(makeSession({ sessionId: 's42' }));

    // don't await — flush both requests synchronously then await
    const submitPromise = store.submitQ1Answer('C');
    const req = http.expectOne('/api/v1/sessions/default/2026-06-02/questions/q1/answers');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toMatchObject({ playerId: 'player-1', answer: 'C' });
    req.flush('');
    await drainMicrotasks();
    // backend returns answers: null while voting is Open — local state tracks the player's own answer
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession({ sessionId: 's42' }));
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

    store.initializeSession(makeSession({ sessionId: 's42', hostId: 'host-1' }));

    const closePromise = store.setQ1CorrectAnswer('A');
    const req = http.expectOne('/api/v1/sessions/default/2026-06-02/questions/q1/correct');
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

// ─── submitQ2Answer ──────────────────────────────────────────────────────────

describe('QuizStore – submitQ2Answer', () => {
  it('PUTs answer to the q2 endpoint and myQ2Answer tracks local state', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession({ sessionId: 's42' }));

    const submitPromise = store.submitQ2Answer('DE');
    const req = http.expectOne('/api/v1/sessions/default/2026-06-02/questions/q2/answers');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toMatchObject({ playerId: 'player-1', answer: 'DE' });
    req.flush('');
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession({ sessionId: 's42' }));
    await submitPromise;

    expect(store.myQ2Answer()).toBe('DE');
  });
});

// ─── setQ2CorrectAnswer ───────────────────────────────────────────────────────

describe('QuizStore – setQ2CorrectAnswer', () => {
  it('POSTs correct answer and q2Status becomes Closed', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Host' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(
      makeSession({
        sessionId: 's42',
        hostId: 'host-1',
        voting: { q1: { status: 'Closed', correctAnswer: 'A' }, q2: { status: 'Open' } },
      }),
    );

    const closePromise = store.setQ2CorrectAnswer('DE');
    const req = http.expectOne('/api/v1/sessions/default/2026-06-02/questions/q2/correct');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ hostId: 'host-1', correctAnswer: 'DE' });
    req.flush(
      makeSession({
        sessionId: 's42',
        voting: {
          q1: { status: 'Closed', correctAnswer: 'A' },
          q2: { status: 'Closed', correctAnswer: 'DE' },
        },
      }),
    );
    await closePromise;

    expect(store.q2Status()).toBe('Closed');
  });
});

// ─── computed signals ────────────────────────────────────────────────────────

describe('QuizStore – computed signals', () => {
  it('q1Status reflects session voting status', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http
      .expectOne('/api/v1/sessions/default/2026-06-02')
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

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession({ hostId: 'host-1' }));
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

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession({ hostId: 'host-1' }));
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

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(
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

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession());
    await promise;

    expect(store.myQ1Answer()).toBeNull();
  });

  it('myQ2Answer returns the country from session when voting is revealed', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(
      makeSession({
        voting: {
          q1: { status: 'Closed', correctAnswer: 'A' },
          q2: {
            status: 'Closed',
            correctAnswer: 'DE',
            answers: { 'player-1': { answer: 'FR', displayName: 'Alice' } },
          },
        },
      }),
    );
    await promise;

    expect(store.myQ2Answer()).toBe('FR');
  });

  it('myQ2Answer returns null when player has not answered Q2', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession());
    await promise;

    expect(store.myQ2Answer()).toBeNull();
  });

  it('q2AnswerCount reflects how many players have answered Q2', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(
      makeSession({
        players: [
          { playerId: 'p1', displayName: 'Alice' },
          { playerId: 'p2', displayName: 'Bob' },
        ],
        voting: {
          q1: { status: 'Closed', correctAnswer: 'A' },
          q2: { status: 'Open', answerCount: 1 },
        },
      }),
    );
    await promise;

    expect(store.q2AnswerCount()).toEqual({ answered: 1, total: 2 });
  });

  it('answerCount reflects how many players have answered', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(
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
  it('updates session without redirecting when phase is Active', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http
      .expectOne('/api/v1/sessions/default/2026-06-02')
      .flush(makeSession({ phase: 'Active', sessionId: 'r1' }));
    await promise;

    expect(store.session()?.sessionId).toBe('r1');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('navigates to /session/default/2026-06-02/results when session phase is Ended', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(makeSession());
    const promise = store.refresh();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession({ phase: 'Ended' }));
    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/session', 'default', '2026-06-02', 'results']);
  });

  it('navigates to /q2 when refreshing on q1 route and Q1 becomes Closed while Q2 opens', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(
      makeSession({ voting: { q1: { status: 'Open' }, q2: { status: 'Open' } } }),
      'q1',
    );
    const promise = store.refresh();
    http
      .expectOne('/api/v1/sessions/default/2026-06-02')
      .flush(makeSession({ voting: { q1: { status: 'Closed' }, q2: { status: 'Open' } } }));
    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/session', 'default', '2026-06-02', 'q2']);
  });

  it('navigates to /q1 when refreshing on q2 route and Q2 becomes Closed while Q1 is Open', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(
      makeSession({ voting: { q1: { status: 'Open' }, q2: { status: 'Open' } } }),
      'q2',
    );
    const promise = store.refresh();
    http
      .expectOne('/api/v1/sessions/default/2026-06-02')
      .flush(makeSession({ voting: { q1: { status: 'Open' }, q2: { status: 'Closed' } } }));
    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/session', 'default', '2026-06-02', 'q1']);
  });
});

// ─── loadSession ─────────────────────────────────────────────────────────────

describe('QuizStore – loadSession', () => {
  it('stores the fetched session in state', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const promise = store.loadSession();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession({ sessionId: 'abc' }));
    await promise;

    expect(store.session()?.sessionId).toBe('abc');
  });

  it('redirects to /session/default/2026-06-02/lobby when session is not Active', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(makeSession());
    const promise = store.loadSession();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession({ phase: 'Lobby' }));
    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/session', 'default', '2026-06-02', 'lobby']);
  });

  it('redirects to /session/default/2026-06-02/results when session is Ended', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(makeSession());
    const promise = store.loadSession();
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession({ phase: 'Ended' }));
    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/session', 'default', '2026-06-02', 'results']);
  });
});

// ─── setQ2CorrectAnswer → navigates to /results ───────────────────────────────

describe('QuizStore – setQ2CorrectAnswer navigates to results', () => {
  it('navigates to /results after the host sets the Q2 correct answer', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Host' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initializeSession(
      makeSession({
        sessionId: 's42',
        hostId: 'host-1',
        voting: { q1: { status: 'Closed', correctAnswer: 'A' }, q2: { status: 'Open' } },
      }),
    );

    const closePromise = store.setQ2CorrectAnswer('DE');
    http.expectOne('/api/v1/sessions/default/2026-06-02/questions/q2/correct').flush(
      makeSession({
        sessionId: 's42',
        phase: 'Ended',
        voting: {
          q1: { status: 'Closed', correctAnswer: 'A' },
          q2: { status: 'Closed', correctAnswer: 'DE' },
        },
      }),
    );
    await closePromise;

    expect(navigateSpy).toHaveBeenCalledWith(['/session', 'default', '2026-06-02', 'results']);
  });
});
