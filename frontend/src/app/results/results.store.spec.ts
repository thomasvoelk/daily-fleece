import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ResultsStore } from './results.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { PlayerResult, SessionResponse, SessionResultsResponse } from '../backend-client';
mockLocalStorage();

const TODAY = '2026-06-12';
const RESULTS_URL = `/api/v1/sessions/default/${TODAY}/results`;

const PROVIDERS = [...provideTestEnvironment(), ResultsStore];

function makeResults(overrides: Partial<SessionResultsResponse> = {}): SessionResultsResponse {
  return {
    sessionId: 's1',
    date: TODAY,
    q1CorrectAnswer: null,
    q2CorrectAnswer: null,
    results: [],
    ...overrides,
  };
}

function makeSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    sessionId: 's1',
    projectId: 'default',
    date: TODAY,
    phase: 'Ended',
    hostId: 'h1',
    players: [],
    voting: { q1: { status: 'Closed' }, q2: { status: 'Closed' } },
    ...overrides,
  };
}

function makePlayer(overrides: Partial<PlayerResult> = {}): PlayerResult {
  return {
    playerId: 'p1',
    displayName: 'Alice',
    q1Correct: false,
    q2Correct: false,
    q1Answer: null,
    q2Answer: null,
    totalPoints: 0,
    ...overrides,
  };
}

// ─── initial state ────────────────────────────────────────────────────────────

describe('ResultsStore – initial state before load', () => {
  it('returns empty/null for all computed signals before data is loaded', () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    expect(store.myResult()).toBeNull();
    expect(store.sortedResults()).toEqual([]);
    expect(store.correctCount()).toBe(0);
    expect(store.myRank()).toBeNull();
    expect(store.q1CorrectAnswer()).toBeNull();
    expect(store.q2CorrectAnswer()).toBeNull();
  });
});

// ─── load ─────────────────────────────────────────────────────────────────────

describe('ResultsStore – load', () => {
  it('makes exactly one HTTP call and populates data', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const loadPromise = store.load();
    http.expectOne(RESULTS_URL).flush(
      makeResults({
        results: [makePlayer({ q1Correct: true, totalPoints: 1 })],
      }),
    );
    await loadPromise;

    expect(store.data()?.sessionId).toBe('s1');
    expect(store.data()?.results).toHaveLength(1);
    http.verify();
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

    store.initializeSession(makeSession());
    const loadPromise = store.load();
    http.expectOne(RESULTS_URL).flush(
      makeResults({
        results: [
          makePlayer({ playerId: 'p1', q1Correct: true, q2Correct: true, totalPoints: 2 }),
          makePlayer({ playerId: 'p2', displayName: 'Bob', totalPoints: 0 }),
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

    store.initializeSession(makeSession());
    const loadPromise = store.load();
    http.expectOne(RESULTS_URL).flush(makeResults());
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

    store.initializeSession(makeSession());
    const loadPromise = store.load();
    http.expectOne(RESULTS_URL).flush(
      makeResults({
        results: [
          makePlayer({ playerId: 'p1', displayName: 'Alice', totalPoints: 0 }),
          makePlayer({
            playerId: 'p2',
            displayName: 'Bob',
            q1Correct: true,
            q2Correct: true,
            totalPoints: 2,
          }),
        ],
      }),
    );
    await loadPromise;

    const sorted = store.sortedResults();
    expect(sorted[0].displayName).toBe('Bob');
    expect(sorted[1].displayName).toBe('Alice');
  });
});

// ─── correct answers from enriched response ────────────────────────────────

describe('ResultsStore – q1CorrectAnswer / q2CorrectAnswer', () => {
  it('exposes the Q1 correct answer from the results response', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const loadPromise = store.load();
    http.expectOne(RESULTS_URL).flush(makeResults({ q1CorrectAnswer: 'B', q2CorrectAnswer: 'FR' }));
    await loadPromise;

    expect(store.q1CorrectAnswer()).toBe('B');
  });

  it('exposes the Q2 correct answer (ISO code) from the results response', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const loadPromise = store.load();
    http.expectOne(RESULTS_URL).flush(makeResults({ q1CorrectAnswer: 'B', q2CorrectAnswer: 'FR' }));
    await loadPromise;

    expect(store.q2CorrectAnswer()).toBe('FR');
  });
});

// ─── enrichedResults ──────────────────────────────────────────────────────────

describe('ResultsStore – correctCount with partial correct answers', () => {
  it('counts only the correct answers the current player got right', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const loadPromise = store.load();
    http.expectOne(RESULTS_URL).flush(
      makeResults({
        results: [
          makePlayer({ playerId: 'p1', q1Correct: true, q2Correct: false, totalPoints: 1 }),
        ],
      }),
    );
    await loadPromise;

    expect(store.correctCount()).toBe(1);
  });

  it('counts a correct Q2 answer when Q1 is wrong', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const loadPromise = store.load();
    http.expectOne(RESULTS_URL).flush(
      makeResults({
        results: [
          makePlayer({ playerId: 'p1', q1Correct: false, q2Correct: true, totalPoints: 1 }),
        ],
      }),
    );
    await loadPromise;

    expect(store.correctCount()).toBe(1);
  });
});

// ─── load with no session ─────────────────────────────────────────────────────

describe('ResultsStore – load with no session', () => {
  it('does nothing when there is no session', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    await store.load();

    http.verify();
  });
});

describe('ResultsStore – enrichedResults', () => {
  it('reads per-player answers directly from PlayerResult', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(ResultsStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession());
    const loadPromise = store.load();
    http.expectOne(RESULTS_URL).flush(
      makeResults({
        q1CorrectAnswer: 'B',
        q2CorrectAnswer: 'FR',
        results: [
          makePlayer({
            playerId: 'p1',
            displayName: 'Alice',
            q1Correct: true,
            q2Correct: true,
            q1Answer: 'B',
            q2Answer: 'FR',
            totalPoints: 2,
          }),
          makePlayer({
            playerId: 'p2',
            displayName: 'Bob',
            q1Correct: false,
            q2Correct: false,
            q1Answer: 'A',
            q2Answer: 'DE',
            totalPoints: 0,
          }),
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

    store.initializeSession(makeSession());
    const loadPromise = store.load();
    http.expectOne(RESULTS_URL).flush(
      makeResults({
        results: [makePlayer({ q1Answer: null, q2Answer: null })],
      }),
    );
    await loadPromise;

    const enriched = store.enrichedResults();
    expect(enriched[0].q1Answer).toBeNull();
    expect(enriched[0].q2Answer).toBeNull();
  });
});
