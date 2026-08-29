import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Results } from './results';
import { ResultsStore, EnrichedResult } from './results.store';
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

function makeStubStore(
  data: SessionResultsResponse | null = null,
  enriched: EnrichedResult[] = [],
  q1CorrectAnswer: string | null = null,
  q2CorrectAnswer: string | null = null,
) {
  const dataSignal = signal(data);
  const results = data?.results ?? [];
  return {
    data: dataSignal,
    myResult: signal(results.find((r) => r.playerId === 'p1') ?? null),
    sortedResults: signal([...results].sort((a, b) => b.totalPoints - a.totalPoints)),
    enrichedResults: signal(enriched),
    correctCount: signal(0),
    myRank: signal<number | null>(null),
    q1CorrectAnswer: signal(q1CorrectAnswer),
    q2CorrectAnswer: signal(q2CorrectAnswer),
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
    const stubStore = makeStubStore(makeResults(), [
      {
        playerId: 'p1',
        displayName: 'Alice',
        q1Answer: 'B',
        q2Answer: 'FR',
        q1Correct: true,
        q2Correct: true,
        totalPoints: 2,
      },
      {
        playerId: 'p2',
        displayName: 'Bob',
        q1Answer: 'A',
        q2Answer: 'DE',
        q1Correct: false,
        q2Correct: false,
        totalPoints: 0,
      },
    ]);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    screen.getByText('Alice');
    screen.getByText('Bob');
  });

  it('shows total points per player', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(makeResults(), [
      {
        playerId: 'p1',
        displayName: 'Alice',
        q1Answer: 'B',
        q2Answer: 'FR',
        q1Correct: true,
        q2Correct: true,
        totalPoints: 2,
      },
      {
        playerId: 'p2',
        displayName: 'Bob',
        q1Answer: 'A',
        q2Answer: 'DE',
        q1Correct: false,
        q2Correct: false,
        totalPoints: 0,
      },
    ]);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('renders empty answer cells when a player has no q1/q2 answer', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(makeResults(), [
      {
        playerId: 'p1',
        displayName: 'Alice',
        q1Answer: null,
        q2Answer: null,
        q1Correct: false,
        q2Correct: false,
        totalPoints: 0,
      },
    ]);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    const row = screen.getByRole('row', { name: 'Alice' });
    const cells = row.querySelectorAll('td');
    expect(cells[2].textContent.trim()).toBe('');
    expect(cells[3].textContent.trim()).toBe('');
  });

  it('shows the player Q1 answer text in the cell', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(makeResults(), [
      {
        playerId: 'p1',
        displayName: 'Alice',
        q1Answer: 'B',
        q2Answer: 'DE',
        q1Correct: true,
        q2Correct: false,
        totalPoints: 1,
      },
      {
        playerId: 'p2',
        displayName: 'Bob',
        q1Answer: 'A',
        q2Answer: 'FR',
        q1Correct: false,
        q2Correct: true,
        totalPoints: 1,
      },
    ]);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(screen.getAllByText('B').length).toBeGreaterThan(0);
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
  });

  it('shows Q2 player answer as German country name', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(makeResults(), [
      {
        playerId: 'p1',
        displayName: 'Alice',
        q1Answer: 'B',
        q2Answer: 'FR',
        q1Correct: true,
        q2Correct: true,
        totalPoints: 2,
      },
    ]);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(screen.getByText('Frankreich')).toBeTruthy();
  });

  it('shows column headers with correct answers', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(makeResults(), [], 'B', 'FR');
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    // Q1 column header shows "✓ B"
    expect(screen.getByText(/✓ B/)).toBeTruthy();
    // Q2 column header shows "✓ Frankreich"
    expect(screen.getByText(/✓ Frankreich/)).toBeTruthy();
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

  it('shows the RANG badge when myRank is set', async () => {
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
    stubStore.myRank = signal(3);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(screen.getByText('#3')).toBeTruthy();
  });
});

// ─── no data ──────────────────────────────────────────────────────────────────

describe('Results – no data', () => {
  it('renders nothing when the results have not loaded yet', async () => {
    const stubStore = makeStubStore(null);
    const { container } = await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(container.querySelector('main')?.textContent.trim()).toBe('');
  });
});

// ─── countryName ──────────────────────────────────────────────────────────────

describe('Results – countryName', () => {
  it('returns an empty string when code is null', async () => {
    const stubStore = makeStubStore(null);
    const { fixture } = await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });
    const instance = fixture.componentInstance as unknown as {
      countryName: (code: string | null) => string;
    };

    expect(instance.countryName(null)).toBe('');
  });
});

// ─── board row highlighting ───────────────────────────────────────────────────

describe('Results – own board row highlighted', () => {
  it("marks the current player's board row as aria-current for screen readers", async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const stubStore = makeStubStore(makeResults(), [
      {
        playerId: 'p1',
        displayName: 'Alice',
        q1Answer: 'B',
        q2Answer: 'FR',
        q1Correct: true,
        q2Correct: true,
        totalPoints: 2,
      },
      {
        playerId: 'p2',
        displayName: 'Bob',
        q1Answer: 'A',
        q2Answer: 'DE',
        q1Correct: false,
        q2Correct: false,
        totalPoints: 0,
      },
    ]);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    expect(screen.getByRole('row', { name: /Alice/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('row', { name: /Bob/ })).not.toHaveAttribute('aria-current');
  });
});

// ─── board sort order ─────────────────────────────────────────────────────────

describe('Results – board sort order', () => {
  it('renders the highest scorer first regardless of response order', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    // Bob (2pts) second in source, but enrichedResults puts him first
    const stubStore = makeStubStore(makeResults(), [
      {
        playerId: 'p2',
        displayName: 'Bob',
        q1Answer: 'B',
        q2Answer: 'FR',
        q1Correct: true,
        q2Correct: true,
        totalPoints: 2,
      },
      {
        playerId: 'p1',
        displayName: 'Alice',
        q1Answer: 'A',
        q2Answer: 'DE',
        q1Correct: false,
        q2Correct: false,
        totalPoints: 0,
      },
    ]);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    const bobRow = screen.getByRole('row', { name: /Bob/ });
    const aliceRow = screen.getByRole('row', { name: /Alice/ });
    // Node.DOCUMENT_POSITION_FOLLOWING (4): Alice comes after Bob → Bob renders first
    expect(
      bobRow.compareDocumentPosition(aliceRow) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

// ─── no highlight when no player ID ──────────────────────────────────────────

describe('Results – no highlight when localStorage has no player ID', () => {
  it('no row has aria-current when localStorage has no player ID', async () => {
    const stubStore = makeStubStore(makeResults(), [
      {
        playerId: 'p1',
        displayName: 'Alice',
        q1Answer: 'B',
        q2Answer: 'FR',
        q1Correct: true,
        q2Correct: true,
        totalPoints: 2,
      },
      {
        playerId: 'p2',
        displayName: 'Bob',
        q1Answer: 'A',
        q2Answer: 'DE',
        q1Correct: false,
        q2Correct: false,
        totalPoints: 0,
      },
    ]);
    await render(Results, {
      providers: [...BASE_PROVIDERS, { provide: ResultsStore, useValue: stubStore }],
    });

    screen.getAllByRole('row').forEach((row) => {
      expect(row).not.toHaveAttribute('aria-current');
    });
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

    await user.click(screen.getByRole('button', { name: 'Zum Leaderboard' }));

    expect(navigateSpy).toHaveBeenCalledWith(['/leaderboard']);
  });
});
