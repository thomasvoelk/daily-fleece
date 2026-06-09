import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ResultsStore } from './results.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResponse, SessionResultsResponse } from '../backend-client';

mockLocalStorage();

const drainMicrotasks = () =>
  new Promise<void>((r) => {
    queueMicrotask(r);
  });

const PROVIDERS = [...provideTestEnvironment(), ResultsStore];

function makeResults(overrides: Partial<SessionResultsResponse> = {}): SessionResultsResponse {
  return {
    sessionId: 's1',
    date: '2026-06-05',
    results: [],
    ...overrides,
  };
}

// ─── load ─────────────────────────────────────────────────────────────────────

describe('ResultsStore – load', () => {
  it('fetches session then results and populates data', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    const loadPromise = store.load();
    http.expectOne('/api/v1/sessions/today').flush({ sessionId: 's1', phase: 'Ended' });
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(
      makeResults({
        results: [
          {
            playerId: 'p1',
            displayName: 'Alice',
            q1Correct: true,
            q2Correct: false,
            totalPoints: 1,
          },
        ],
      }),
    );
    await loadPromise;

    expect(store.data()?.sessionId).toBe('s1');
    expect(store.data()?.results).toHaveLength(1);
  });
});

// ─── computed signals ─────────────────────────────────────────────────────────

describe('ResultsStore – myResult', () => {
  it('returns the current player entry', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    const loadPromise = store.load();
    http.expectOne('/api/v1/sessions/today').flush({ sessionId: 's1', phase: 'Ended' });
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(
      makeResults({
        results: [
          {
            playerId: 'p1',
            displayName: 'Alice',
            q1Correct: true,
            q2Correct: true,
            totalPoints: 2,
          },
          {
            playerId: 'p2',
            displayName: 'Bob',
            q1Correct: false,
            q2Correct: false,
            totalPoints: 0,
          },
        ],
      }),
    );
    await loadPromise;

    expect(store.myResult()?.playerId).toBe('p1');
    expect(store.correctCount()).toBe(2);
    expect(store.myRank()).toBe(1);
  });

  it('returns null when current player is not in results', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p99', companyId: 'acme', displayName: 'Ghost' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    const loadPromise = store.load();
    http.expectOne('/api/v1/sessions/today').flush({ sessionId: 's1', phase: 'Ended' });
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(makeResults());
    await loadPromise;

    expect(store.myResult()).toBeNull();
    expect(store.correctCount()).toBe(0);
    expect(store.myRank()).toBeNull();
  });
});

describe('ResultsStore – sortedResults', () => {
  it('orders entries by totalPoints descending', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    const loadPromise = store.load();
    http.expectOne('/api/v1/sessions/today').flush({ sessionId: 's1', phase: 'Ended' });
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(
      makeResults({
        results: [
          {
            playerId: 'p1',
            displayName: 'Alice',
            q1Correct: false,
            q2Correct: false,
            totalPoints: 0,
          },
          { playerId: 'p2', displayName: 'Bob', q1Correct: true, q2Correct: true, totalPoints: 2 },
        ],
      }),
    );
    await loadPromise;

    const sorted = store.sortedResults();
    expect(sorted[0].displayName).toBe('Bob');
    expect(sorted[1].displayName).toBe('Alice');
  });
});

// ─── correct answers from session ─────────────────────────────────────────────

function makeSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    sessionId: 's1',
    date: '2026-06-05',
    hostId: 'host-1',
    phase: 'Ended',
    projectId: 'default',
    players: [],
    voting: {
      q1: { status: 'Closed', correctAnswer: 'B' },
      q2: { status: 'Closed', correctAnswer: 'FR' },
    },
    ...overrides,
  };
}

describe('ResultsStore – q1CorrectAnswer / q2CorrectAnswer', () => {
  it('exposes the Q1 correct answer from the session', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    const loadPromise = store.load();
    http.expectOne('/api/v1/sessions/today').flush(makeSession());
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(makeResults());
    await loadPromise;

    expect(store.q1CorrectAnswer()).toBe('B');
  });

  it('exposes the Q2 correct answer (ISO code) from the session', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    const loadPromise = store.load();
    http.expectOne('/api/v1/sessions/today').flush(makeSession());
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(makeResults());
    await loadPromise;

    expect(store.q2CorrectAnswer()).toBe('FR');
  });
});

// ─── enrichedResults ──────────────────────────────────────────────────────────

describe('ResultsStore – enrichedResults', () => {
  it('joins per-player answers from session voting with sorted results', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    const loadPromise = store.load();
    http.expectOne('/api/v1/sessions/today').flush(
      makeSession({
        voting: {
          q1: {
            status: 'Closed',
            correctAnswer: 'B',
            answers: {
              p1: { answer: 'B', displayName: 'Alice' },
              p2: { answer: 'A', displayName: 'Bob' },
            },
          },
          q2: {
            status: 'Closed',
            correctAnswer: 'FR',
            answers: {
              p1: { answer: 'FR', displayName: 'Alice' },
              p2: { answer: 'DE', displayName: 'Bob' },
            },
          },
        },
      }),
    );
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(
      makeResults({
        results: [
          {
            playerId: 'p1',
            displayName: 'Alice',
            q1Correct: true,
            q2Correct: true,
            totalPoints: 2,
          },
          {
            playerId: 'p2',
            displayName: 'Bob',
            q1Correct: false,
            q2Correct: false,
            totalPoints: 0,
          },
        ],
      }),
    );
    await loadPromise;

    const enriched = store.enrichedResults();
    expect(enriched).toHaveLength(2);
    // Alice is first (2 pts)
    expect(enriched[0].playerId).toBe('p1');
    expect(enriched[0].q1Answer).toBe('B');
    expect(enriched[0].q2Answer).toBe('FR');
    // Bob is second (0 pts)
    expect(enriched[1].playerId).toBe('p2');
    expect(enriched[1].q1Answer).toBe('A');
    expect(enriched[1].q2Answer).toBe('DE');
  });

  it('uses null for players who did not answer', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    const loadPromise = store.load();
    http
      .expectOne('/api/v1/sessions/today')
      .flush(
        makeSession({
          voting: {
            q1: { status: 'Closed', correctAnswer: 'B' },
            q2: { status: 'Closed', correctAnswer: 'FR' },
          },
        }),
      );
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(
      makeResults({
        results: [
          {
            playerId: 'p1',
            displayName: 'Alice',
            q1Correct: false,
            q2Correct: false,
            totalPoints: 0,
          },
        ],
      }),
    );
    await loadPromise;

    const enriched = store.enrichedResults();
    expect(enriched[0].q1Answer).toBeNull();
    expect(enriched[0].q2Answer).toBeNull();
  });
});
