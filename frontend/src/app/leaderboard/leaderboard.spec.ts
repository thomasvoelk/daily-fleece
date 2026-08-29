import { render, screen, within } from '@testing-library/angular';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Leaderboard } from './leaderboard';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { LeaderboardResponse } from '../backend-client';

mockLocalStorage();

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
    await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(makeLeaderboard());

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
    await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(
      makeLeaderboard({
        entries: [
          { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 5, totalPoints: 10 },
          { playerId: 'p2', displayName: 'Bob', sessionsParticipated: 3, totalPoints: 6 },
        ],
      }),
    );

    await screen.findByText('#1');
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
    await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(
      makeLeaderboard({
        entries: [
          { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 7, totalPoints: 14 },
          { playerId: 'p2', displayName: 'Bob', sessionsParticipated: 3, totalPoints: 4 },
        ],
      }),
    );

    const aliceRow = await screen.findByRole('row', { name: 'Alice' });
    within(aliceRow).getByText('7 Sessions');
    within(aliceRow).getByText('14');

    const bobRow = screen.getByRole('row', { name: 'Bob' });
    within(bobRow).getByText('3 Sessions');
    within(bobRow).getByText('4');
  });
});

// ─── own-row highlight ────────────────────────────────────────────────────────

describe('Leaderboard – own-row highlight', () => {
  it('marks the current player row as aria-current and leaves others plain', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(
      makeLeaderboard({
        entries: [
          { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 5, totalPoints: 10 },
          { playerId: 'p2', displayName: 'Bob', sessionsParticipated: 3, totalPoints: 6 },
        ],
      }),
    );

    expect(await screen.findByRole('row', { name: 'Alice' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('row', { name: 'Bob' })).not.toHaveAttribute('aria-current');
  });
});

// ─── entries rendered ─────────────────────────────────────────────────────────

describe('Leaderboard – entries rendered', () => {
  it('shows player display names from API response', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(
      makeLeaderboard({
        entries: [
          { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 5, totalPoints: 10 },
          { playerId: 'p2', displayName: 'Bob', sessionsParticipated: 3, totalPoints: 6 },
        ],
      }),
    );

    await screen.findByRole('row', { name: 'Alice' });
    screen.getByRole('row', { name: 'Bob' });
  });
});

// ─── presentation glyph sorting ──────────────────────────────────────────────

describe('Leaderboard – presentation glyph in display name', () => {
  it('renders correctly when a display name contains the presentation glyph (🐰)', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p2', companyId: 'acme', displayName: 'Bob' }),
    );
    await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/leaderboard').flush(
      makeLeaderboard({
        entries: [
          { playerId: 'p1', displayName: 'Ali🐰e', sessionsParticipated: 3, totalPoints: 6 },
          { playerId: 'p2', displayName: 'Bob', sessionsParticipated: 5, totalPoints: 10 },
        ],
      }),
    );

    // Ali🐰e gets a visual alignment bonus, ranking her above Bob despite fewer raw points
    await screen.findByRole('row', { name: 'Ali🐰e' });
    screen.getByRole('row', { name: 'Bob' });
  });
});

// ─── champion fireworks ──────────────────────────────────────────────────────

describe('Leaderboard – champion fireworks', () => {
  async function renderWith(entries: LeaderboardResponse['entries']) {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p2', companyId: 'acme', displayName: 'Me' }),
    );
    const { container } = await render(Leaderboard, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/leaderboard').flush(makeLeaderboard({ entries }));
    return container;
  }

  it('renders fireworks whenever the board has a champion', async () => {
    const container = await renderWith([
      { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 5, totalPoints: 10 },
      { playerId: 'p2', displayName: 'Bob', sessionsParticipated: 3, totalPoints: 6 },
    ]);
    await screen.findByRole('row', { name: 'Alice' });

    expect(container.querySelector('[data-fireworks]')).not.toBeNull();
  });

  it('does not render fireworks for an empty board', async () => {
    const container = await renderWith([]);
    await screen.findByText('Rangliste');

    expect(container.querySelector('[data-fireworks]')).toBeNull();
  });

  it('does not show the rank text when the current player is not on the board', async () => {
    await renderWith([
      { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 5, totalPoints: 10 },
    ]);
    await screen.findByRole('row', { name: 'Alice' });

    expect(screen.queryByText(/Platz/)).toBeNull();
  });
});

// ─── unit-level computed signals ──────────────────────────────────────────────

describe('Leaderboard – computed signals', () => {
  it('entries() is empty before the leaderboard has loaded', () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const fixture = TestBed.createComponent(Leaderboard);
    const instance = fixture.componentInstance as unknown as {
      entries: () => unknown[];
      myRank: () => number | null;
    };
    fixture.detectChanges();

    expect(instance.entries()).toEqual([]);
    expect(instance.myRank()).toBeNull();

    TestBed.inject(HttpTestingController).expectOne('/api/v1/leaderboard').flush(makeLeaderboard());
  });

  it('myRank() is null when the current player is not on the board', () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'not-listed', companyId: 'acme', displayName: 'Ghost' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const fixture = TestBed.createComponent(Leaderboard);
    const instance = fixture.componentInstance as unknown as { myRank: () => number | null };
    fixture.detectChanges();

    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/leaderboard')
      .flush(
        makeLeaderboard({
          entries: [
            { playerId: 'p1', displayName: 'Alice', sessionsParticipated: 5, totalPoints: 10 },
          ],
        }),
      );

    expect(instance.myRank()).toBeNull();
  });
});
