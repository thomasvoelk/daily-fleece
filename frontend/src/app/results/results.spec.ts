import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Results } from './results';
import { ResultsStore } from './results.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResultsResponse } from '../backend-client';

mockLocalStorage();

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class LeaderboardStub {}

const BASE_PROVIDERS = [
  ...provideTestEnvironment(),
  provideRouter([{ path: 'leaderboard', component: LeaderboardStub }]),
];

function makeResults(overrides: Partial<SessionResultsResponse> = {}): SessionResultsResponse {
  return {
    sessionId: 's1',
    date: '2026-06-05',
    results: [],
    ...overrides,
  };
}

function makeStubStore(data: SessionResultsResponse | null = null) {
  const dataSignal = signal(data);
  const results = data?.results ?? [];
  return {
    data: dataSignal,
    myResult: signal(results.find((r) => r.playerId === 'p1') ?? null),
    sortedResults: signal([...results].sort((a, b) => b.totalPoints - a.totalPoints)),
    correctCount: signal(0),
    myRank: signal<number | null>(null),
    load: () => Promise.resolve(),
  };
}

// ─── player table ─────────────────────────────────────────────────────────────

describe('Results – player table', () => {
  it('shows player display names from the results response', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(
      makeResults({
        results: [
          {
            playerId: 'p1',
            displayName: 'Alice',
            q1Correct: true,
            q2Correct: false,
            totalPoints: 1,
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
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    screen.getByText('Alice');
    screen.getByText('Bob');
  });

  it('shows Q1 and Q2 correct indicators and total points per player', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(
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
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });
});

// ─── arcade headline ──────────────────────────────────────────────────────────

describe('Results – arcade headline', () => {
  it('shows Perfekt! when correctCount is 2', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(makeResults());
    stubStore.myResult = signal({
      playerId: 'p1',
      displayName: 'Alice',
      q1Correct: true,
      q2Correct: true,
      totalPoints: 2,
    });
    stubStore.correctCount = signal(2);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(screen.getByText(/Perfekt/)).toBeTruthy();
  });

  it('shows Gut dabei! when correctCount is 1', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(makeResults());
    stubStore.myResult = signal({
      playerId: 'p1',
      displayName: 'Alice',
      q1Correct: true,
      q2Correct: false,
      totalPoints: 1,
    });
    stubStore.correctCount = signal(1);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(screen.getByText(/Gut dabei/)).toBeTruthy();
  });

  it('shows Weiter so! when correctCount is 0', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(makeResults());
    stubStore.myResult = signal({
      playerId: 'p1',
      displayName: 'Alice',
      q1Correct: false,
      q2Correct: false,
      totalPoints: 0,
    });
    stubStore.correctCount = signal(0);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(screen.getByText(/Weiter so/)).toBeTruthy();
  });
});

// ─── board row highlighting ───────────────────────────────────────────────────

describe('Results – own board row highlighted', () => {
  it("marks the current player's board row as aria-current for screen readers", async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(
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
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(screen.getByRole('listitem', { name: /Alice/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('listitem', { name: /Bob/ })).not.toHaveAttribute('aria-current');
  });
});

// ─── board sort order ─────────────────────────────────────────────────────────

describe('Results – board sort order', () => {
  it('renders the highest scorer first regardless of response order', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    // Bob (2pts) second in source, but sortedResults puts him first
    const stubStore = makeStubStore(
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
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    const bobRow = screen.getByRole('listitem', { name: /Bob/ });
    const aliceRow = screen.getByRole('listitem', { name: /Alice/ });
    // Node.DOCUMENT_POSITION_FOLLOWING (4): Alice comes after Bob → Bob renders first
    expect(
      bobRow.compareDocumentPosition(aliceRow) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

// ─── Zum Leaderboard button ───────────────────────────────────────────────────

describe('Results – Zum Leaderboard button', () => {
  it('navigates to /leaderboard when button is clicked', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const user = userEvent.setup();
    const stubStore = makeStubStore(makeResults());
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    await user.click(screen.getByRole('button', { name: /leaderboard/i }));

    expect(navigateSpy).toHaveBeenCalledWith(['/leaderboard']);
  });
});
