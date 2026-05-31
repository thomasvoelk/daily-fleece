import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Lobby } from './lobby';
import { LobbyStore } from './lobby.store';
import { provideTestEnvironment } from '../../testing/providers';
import { expectNoA11yViolations } from '../../testing/a11y';
import { mockLocalStorage } from '../../testing/local-storage';
import { SessionResponse } from '../api/models';

mockLocalStorage();

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

const PROVIDERS = [...provideTestEnvironment(), LobbyStore];

// ─── tests ───────────────────────────────────────────────────────────────────

describe('Lobby – a11y', () => {
  it('has no axe violations in idle state', async () => {
    const { container } = await render(Lobby, { providers: PROVIDERS });
    await expectNoA11yViolations(container);
  });

  it('has persistent live regions in the DOM before any error occurs', async () => {
    await render(Lobby, { providers: PROVIDERS });
    // role=alert elements must be in the DOM before text is injected so screen
    // readers fire the change announcement rather than reading static content
    expect(screen.queryAllByRole('alert').length).toBeGreaterThan(0);
  });
});

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

    http.expectOne('/api/v1/players').flush({
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

    http.expectOne('/api/v1/players').flush({
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

describe('Lobby – generic error', () => {
  it('shows error message and keeps the form visible so users can retry', async () => {
    const user = userEvent.setup();
    await render(Lobby, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    await user.type(screen.getByRole('textbox', { name: /company id/i }), 'acme');
    await user.type(screen.getByRole('textbox', { name: /display name/i }), 'Alice');
    await user.click(screen.getByRole('button', { name: /join/i }));

    http
      .expectOne('/api/v1/players')
      .flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    await screen.findByText(/something went wrong/i);
    screen.getByRole('button', { name: /join/i });
  });
});

describe('Lobby – form pre-fill from storage', () => {
  it('pre-fills inputs with previously stored player data', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: null, companyId: 'acme', displayName: 'Alice' }),
    );
    await render(Lobby, { providers: PROVIDERS });

    expect((screen.getByRole('textbox', { name: /company id/i }) as HTMLInputElement).value).toBe(
      'acme',
    );
    expect((screen.getByRole('textbox', { name: /display name/i }) as HTMLInputElement).value).toBe(
      'Alice',
    );
  });
});

describe('Lobby – 409 with unrelated body', () => {
  it('shows generic error when a 409 carries an unrecognised body type', async () => {
    const user = userEvent.setup();
    await render(Lobby, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    await user.type(screen.getByRole('textbox', { name: /company id/i }), 'acme');
    await user.type(screen.getByRole('textbox', { name: /display name/i }), 'Alice');
    await user.click(screen.getByRole('button', { name: /join/i }));

    http.expectOne('/api/v1/players').flush({
      playerId: 'p1',
      displayName: 'Alice',
    } satisfies import('../api/models').PlayerResponse);
    await drainMicrotasks();

    http.expectOne('/api/v1/sessions/today').flush(makeSession('s1'));
    await drainMicrotasks();

    http
      .expectOne('/api/v1/sessions/s1/join')
      .flush({ type: '/problems/some-other-conflict' }, { status: 409, statusText: 'Conflict' });

    await screen.findByText(/something went wrong/i);
    expect(screen.queryByText(/session is already in progress/i)).toBeNull();
  });
});

describe('Lobby – cross-tab storage write', () => {
  it('preserves typed values when another tab updates storage', async () => {
    const user = userEvent.setup();
    await render(Lobby, { providers: PROVIDERS });

    await user.type(screen.getByRole('textbox', { name: /company id/i }), 'acme');
    await user.type(screen.getByRole('textbox', { name: /display name/i }), 'Alice');

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'lobby-player',
        newValue: JSON.stringify({
          playerId: null,
          companyId: 'other-company',
          displayName: 'Other',
        }),
      }),
    );

    expect((screen.getByRole('textbox', { name: /company id/i }) as HTMLInputElement).value).toBe(
      'acme',
    );
    expect((screen.getByRole('textbox', { name: /display name/i }) as HTMLInputElement).value).toBe(
      'Alice',
    );
  });
});

describe('Lobby – error retry', () => {
  it('preserves edited values when retrying after a join error', async () => {
    const user = userEvent.setup();
    await render(Lobby, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    // First join attempt — registerPlayer succeeds, getTodaySession fails
    await user.type(screen.getByRole('textbox', { name: /company id/i }), 'acme');
    await user.type(screen.getByRole('textbox', { name: /display name/i }), 'Alice');
    await user.click(screen.getByRole('button', { name: /join/i }));

    http.expectOne('/api/v1/players').flush({
      playerId: 'p1',
      displayName: 'Alice',
    } satisfies import('../api/models').PlayerResponse);
    await drainMicrotasks();

    http
      .expectOne('/api/v1/sessions/today')
      .flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    await screen.findByText(/something went wrong/i);
    screen.getByRole('button', { name: /join/i }); // form is visible (df-0hq fix)

    // User edits the company ID for retry
    const companyIdInput = screen.getByRole('textbox', { name: /company id/i });
    await user.clear(companyIdInput);
    await user.type(companyIdInput, 'acme-v2');

    // Another tab writes the original values back — should not clobber the edit
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'lobby-player',
        newValue: JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
      }),
    );

    expect((companyIdInput as HTMLInputElement).value).toBe('acme-v2');

    // Retry — the server should receive the edited company ID
    await user.click(screen.getByRole('button', { name: /join/i }));
    const req = http.expectOne('/api/v1/players');
    expect(req.request.body).toMatchObject({ companyId: 'acme-v2' });
    req.flush({
      playerId: 'p2',
      displayName: 'Alice',
    } satisfies import('../api/models').PlayerResponse);
    // drain remaining requests to avoid open-request warnings
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/today').flush(makeSession('s1'));
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

    http.expectOne('/api/v1/players').flush({
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

  it('shows an error alert when Refresh fails', async () => {
    const user = userEvent.setup();
    await render(Lobby, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    await user.type(screen.getByRole('textbox', { name: /company id/i }), 'acme');
    await user.type(screen.getByRole('textbox', { name: /display name/i }), 'Alice');
    await user.click(screen.getByRole('button', { name: /join/i }));

    http.expectOne('/api/v1/players').flush({
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

    await user.click(screen.getByRole('button', { name: /refresh/i }));
    http
      .expectOne('/api/v1/sessions/today')
      .flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    await screen.findByText(/refresh failed/i);
    expect(screen.getByText('Alice')).toBeTruthy();
  });
});
