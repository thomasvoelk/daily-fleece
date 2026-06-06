import { render, screen } from '@testing-library/angular';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Leaderboard } from './leaderboard';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { LeaderboardResponse } from '../backend-client';

mockLocalStorage();

const drainMicrotasks = () =>
  new Promise<void>((r) => {
    queueMicrotask(r);
  });

const PROVIDERS = [...provideTestEnvironment(), provideRouter([])];

function makeLeaderboard(overrides: Partial<LeaderboardResponse> = {}): LeaderboardResponse {
  return {
    projectId: 'proj1',
    entries: [],
    ...overrides,
  };
}

// ─── API call ─────────────────────────────────────────────────────────────────

describe('Leaderboard – API call', () => {
  it('fires GET /leaderboard on init', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(makeLeaderboard());
    await drainMicrotasks();
    fixture.detectChanges();

    http.verify();
  });
});

// ─── rank column ─────────────────────────────────────────────────────────────

describe('Leaderboard – rank column', () => {
  it('shows #1 for the first entry and #2 for the second', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(
      makeLeaderboard({
        entries: [
          { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 5, totalPoints: 10 },
          { playerId: 'p2', displayName: 'Bob', sessionsParticipated: 3, totalPoints: 6 },
        ],
      }),
    );
    await drainMicrotasks();
    fixture.detectChanges();

    screen.getByText('#1');
    screen.getByText('#2');
  });
});

// ─── stats columns ────────────────────────────────────────────────────────────

describe('Leaderboard – stats columns', () => {
  it('shows sessionsParticipated and totalPoints for each entry', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(
      makeLeaderboard({
        entries: [
          { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 7, totalPoints: 14 },
          { playerId: 'p2', displayName: 'Bob', sessionsParticipated: 3, totalPoints: 4 },
        ],
      }),
    );
    await drainMicrotasks();
    fixture.detectChanges();

    screen.getByText('7');
    screen.getByText('14');
    screen.getByText('3');
    screen.getByText('4');
  });
});

// ─── own-row highlight ────────────────────────────────────────────────────────

describe('Leaderboard – own-row highlight', () => {
  it('highlights the current player row with bg-grape-200 and leaves others plain', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(
      makeLeaderboard({
        entries: [
          { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 5, totalPoints: 10 },
          { playerId: 'p2', displayName: 'Bob', sessionsParticipated: 3, totalPoints: 6 },
        ],
      }),
    );
    await drainMicrotasks();
    fixture.detectChanges();

    const rows = screen.getAllByRole('listitem');
    expect(rows[0].getAttribute('aria-current')).toBe('true');
    expect(rows[1].getAttribute('aria-current')).toBeNull();
  });
});

// ─── entries rendered ─────────────────────────────────────────────────────────

describe('Leaderboard – entries rendered', () => {
  it('shows player display names from API response', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(
      makeLeaderboard({
        entries: [
          { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 5, totalPoints: 10 },
          { playerId: 'p2', displayName: 'Bob', sessionsParticipated: 3, totalPoints: 6 },
        ],
      }),
    );
    await drainMicrotasks();
    fixture.detectChanges();

    screen.getByText('Alice');
    screen.getByText('Bob');
  });
});
