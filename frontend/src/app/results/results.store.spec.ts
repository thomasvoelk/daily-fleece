import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ResultsStore } from './results.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResultsResponse } from '../backend-client';

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
