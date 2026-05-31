import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Lobby } from './lobby';
import { LobbyStore } from './lobby.store';
import { EntryStore } from '../entry/entry.store';
import { provideTestEnvironment } from '../../testing/providers';
import { expectNoA11yViolations } from '../../testing/a11y';
import { mockLocalStorage } from '../../testing/local-storage';
import { SessionResponse } from '../api/models';

mockLocalStorage();

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

const PROVIDERS = [...provideTestEnvironment(), EntryStore, LobbyStore];

// ─── a11y ────────────────────────────────────────────────────────────────────

describe('Lobby – a11y', () => {
  it('has no axe violations', async () => {
    const { container, fixture } = await render(Lobby, { providers: PROVIDERS });
    TestBed.inject(LobbyStore).initializeSession(
      makeSession({ players: [{ playerId: 'p1', displayName: 'Alice' }] }),
    );
    fixture.detectChanges();
    await expectNoA11yViolations(container);
  });

  it('has a persistent live region for refresh errors', async () => {
    await render(Lobby, { providers: PROVIDERS });
    expect(screen.queryAllByRole('alert').length).toBeGreaterThan(0);
  });
});

// ─── player list ─────────────────────────────────────────────────────────────

describe('Lobby – player list', () => {
  it('shows players from the session', async () => {
    const { fixture } = await render(Lobby, { providers: PROVIDERS });
    TestBed.inject(LobbyStore).initializeSession(
      makeSession({
        players: [
          { playerId: 'p1', displayName: 'Alice' },
          { playerId: 'p2', displayName: 'Bob' },
        ],
      }),
    );
    fixture.detectChanges();

    screen.getByText('Alice');
    screen.getByText('Bob');
  });
});

// ─── Start Quiz button ────────────────────────────────────────────────────────

describe('Lobby – Start Quiz button', () => {
  it('is shown when the current player is the host', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Lobby, { providers: PROVIDERS });
    TestBed.inject(LobbyStore).initializeSession(makeSession({ hostId: 'host-1' }));
    fixture.detectChanges();

    screen.getByRole('button', { name: /start quiz/i });
  });

  it('is absent for a regular player', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-2', companyId: 'acme', displayName: 'Bob' }),
    );
    const { fixture } = await render(Lobby, { providers: PROVIDERS });
    TestBed.inject(LobbyStore).initializeSession(makeSession({ hostId: 'host-1' }));
    fixture.detectChanges();

    expect(screen.queryByRole('button', { name: /start quiz/i })).toBeNull();
  });
});

// ─── Refresh ──────────────────────────────────────────────────────────────────

describe('Lobby – Refresh', () => {
  it('updates the player list on success', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Lobby, { providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession({ players: [{ playerId: 'p1', displayName: 'Alice' }] }));
    fixture.detectChanges();

    await screen.findByText('Alice');

    await user.click(screen.getByRole('button', { name: /refresh/i }));
    http.expectOne('/api/v1/sessions/today').flush(
      makeSession({
        players: [
          { playerId: 'p1', displayName: 'Alice' },
          { playerId: 'p2', displayName: 'Bob' },
        ],
      }),
    );

    await screen.findByText('Bob');
  });

  it('shows error alert on failure without clearing the player list', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Lobby, { providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession({ players: [{ playerId: 'p1', displayName: 'Alice' }] }));
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: /refresh/i }));
    http
      .expectOne('/api/v1/sessions/today')
      .flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    await screen.findByText(/refresh failed/i);
    expect(screen.getByText('Alice')).toBeTruthy();
  });
});
