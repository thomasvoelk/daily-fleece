import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Lobby } from './lobby';
import { LobbyStore } from './lobby.store';
import {
  provideTestEnvironment,
  expectNoA11yViolations,
  mockLocalStorage,
} from '../shared/testing';
import { SessionResponse } from '../backend-client';

mockLocalStorage();

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class QuizStub {}

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

const PROVIDERS = [
  ...provideTestEnvironment(),
  provideRouter([{ path: 'quiz', component: QuizStub }]),
  LobbyStore,
];

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

  it('has a persistent live region for errors', async () => {
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

// ─── Go to Quiz button ────────────────────────────────────────────────────────

describe('Lobby – Go to Quiz button', () => {
  it('is visible to non-host players', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-2', companyId: 'acme', displayName: 'Bob' }),
    );
    const { fixture } = await render(Lobby, { providers: PROVIDERS });
    TestBed.inject(LobbyStore).initializeSession(makeSession({ hostId: 'host-1' }));
    fixture.detectChanges();

    screen.getByRole('button', { name: /go to quiz/i });
  });

  it('shows error when session is still in Lobby phase', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Lobby, { providers: PROVIDERS });
    const store = TestBed.inject(LobbyStore);
    const http = TestBed.inject(HttpTestingController);

    store.initializeSession(makeSession({ players: [{ playerId: 'p1', displayName: 'Alice' }] }));
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: /go to quiz/i }));
    http
      .expectOne('/api/v1/sessions/today')
      .flush(makeSession({ phase: 'Lobby', players: [{ playerId: 'p1', displayName: 'Alice' }] }));

    await screen.findByText(/not started/i);
    expect(screen.getByText('Alice')).toBeTruthy();
  });
});
