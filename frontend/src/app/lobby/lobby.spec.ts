import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Lobby } from './lobby';
import { SessionResponse } from '../api/models';

// localStorage polyfill — the Node test environment doesn't provide it
const _store: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (k) => _store[k] ?? null,
  setItem: (k, v) => {
    _store[k] = v;
  },
  removeItem: (k) => {
    delete _store[k];
  },
  clear: () => {
    for (const k of Object.keys(_store)) delete _store[k];
  },
  key: (i) => Object.keys(_store)[i] ?? null,
  get length() {
    return Object.keys(_store).length;
  },
};
beforeAll(() => vi.stubGlobal('localStorage', localStorageMock));
beforeEach(() => localStorageMock.clear());

// ─── helpers ────────────────────────────────────────────────────────────────

/** Drains the microtask queue so the store's async chain schedules its next HTTP call. */
const drainMicrotasks = () => new Promise<void>((r) => queueMicrotask(r));

function makeSession(sessionId: string, players: SessionResponse['players'] = []): SessionResponse {
  return {
    sessionId,
    date: '2026-05-30',
    hostId: 'host-1',
    phase: 'Lobby',
    projectId: 'default',
    players,
    photos: { q1: '', q2: '' },
    voting: { q1: { status: 'Open' }, q2: { status: 'Open' } },
  };
}

const PROVIDERS = [provideHttpClient(), provideHttpClientTesting()];

// ─── tests ───────────────────────────────────────────────────────────────────

describe('Lobby – idle state', () => {
  it('shows Company ID and Display name inputs and a Join button', async () => {
    await render(Lobby, { providers: PROVIDERS });

    screen.getByRole('textbox', { name: /company id/i });
    screen.getByRole('textbox', { name: /display name/i });
    screen.getByRole('button', { name: /join/i });
  });
});

describe('Lobby – happy-path join', () => {
  it('shows player list after a successful join', async () => {
    const user = userEvent.setup();
    await render(Lobby, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    await user.type(screen.getByRole('textbox', { name: /company id/i }), 'acme');
    await user.type(screen.getByRole('textbox', { name: /display name/i }), 'Alice');
    await user.click(screen.getByRole('button', { name: /join/i }));

    http
      .expectOne('/api/v1/players')
      .flush({
        playerId: 'p1',
        displayName: 'Alice',
      } satisfies import('../api/models').PlayerResponse);
    await drainMicrotasks();

    http.expectOne('/api/v1/sessions/today').flush(makeSession('s1'));
    await drainMicrotasks();

    http
      .expectOne('/api/v1/sessions/s1/join')
      .flush(makeSession('s1', [{ playerId: 'p1', displayName: 'Alice' }]));

    await screen.findByText('Alice');
    expect(screen.queryByRole('button', { name: /join/i })).toBeNull();
  });
});

describe('Lobby – 409 session already in progress', () => {
  it('shows inProgress message and hides the form on 409', async () => {
    const user = userEvent.setup();
    await render(Lobby, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    await user.type(screen.getByRole('textbox', { name: /company id/i }), 'acme');
    await user.type(screen.getByRole('textbox', { name: /display name/i }), 'Alice');
    await user.click(screen.getByRole('button', { name: /join/i }));

    http
      .expectOne('/api/v1/players')
      .flush({
        playerId: 'p1',
        displayName: 'Alice',
      } satisfies import('../api/models').PlayerResponse);
    await drainMicrotasks();

    http.expectOne('/api/v1/sessions/today').flush(makeSession('s1'));
    await drainMicrotasks();

    http
      .expectOne('/api/v1/sessions/s1/join')
      .flush({ type: '/problems/session-already-active' }, { status: 409, statusText: 'Conflict' });

    await screen.findByText(/session is already in progress/i);
    expect(screen.queryByRole('button', { name: /join/i })).toBeNull();
  });
});

describe('Lobby – refresh', () => {
  it('shows new players after Refresh is clicked', async () => {
    const user = userEvent.setup();
    await render(Lobby, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    // perform happy-path join first
    await user.type(screen.getByRole('textbox', { name: /company id/i }), 'acme');
    await user.type(screen.getByRole('textbox', { name: /display name/i }), 'Alice');
    await user.click(screen.getByRole('button', { name: /join/i }));

    http
      .expectOne('/api/v1/players')
      .flush({
        playerId: 'p1',
        displayName: 'Alice',
      } satisfies import('../api/models').PlayerResponse);
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/today').flush(makeSession('s1'));
    await drainMicrotasks();
    http
      .expectOne('/api/v1/sessions/s1/join')
      .flush(makeSession('s1', [{ playerId: 'p1', displayName: 'Alice' }]));

    await screen.findByText('Alice');

    // click Refresh
    await user.click(screen.getByRole('button', { name: /refresh/i }));
    http.expectOne('/api/v1/sessions/today').flush(
      makeSession('s1', [
        { playerId: 'p1', displayName: 'Alice' },
        { playerId: 'p2', displayName: 'Bob' },
      ]),
    );

    await screen.findByText('Bob');
  });
});
