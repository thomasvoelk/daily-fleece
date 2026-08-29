import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Entry } from './entry';
import { EntryStore } from './entry.store';
import {
  provideTestEnvironment,
  expectNoA11yViolations,
  mockLocalStorage,
} from '../shared/testing';

mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), EntryStore];

// ─── a11y ────────────────────────────────────────────────────────────────────

describe('Entry – a11y', () => {
  it('has no axe violations', async () => {
    const { container } = await render(Entry, { providers: PROVIDERS });
    await expectNoA11yViolations(container);
  });
});

// ─── idle state ──────────────────────────────────────────────────────────────

describe('Entry – idle state', () => {
  it('shows Company ID, Display Name inputs and both action buttons', async () => {
    await render(Entry, { providers: PROVIDERS });

    screen.getByRole('textbox', { name: 'Firmen-ID' });
    screen.getByRole('textbox', { name: 'Anzeigename' });
    screen.getByRole('button', { name: 'Lobby beitreten' });
    screen.getByRole('button', { name: 'Lobby erstellen' });
  });
});

// ─── pre-fill ────────────────────────────────────────────────────────────────

describe('Entry – pre-fill from storage', () => {
  it('pre-fills inputs with previously stored player data', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: null, companyId: 'acme', displayName: 'Alice' }),
    );

    await render(Entry, { providers: PROVIDERS });

    expect(screen.getByRole('textbox', { name: 'Firmen-ID' })).toHaveValue('acme');
    expect(screen.getByRole('textbox', { name: 'Anzeigename' })).toHaveValue('Alice');
  });
});

// ─── error phase ─────────────────────────────────────────────────────────────

describe('Entry – error phase', () => {
  it('shows an error alert when joining the lobby fails', async () => {
    const user = userEvent.setup();
    await render(Entry, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    await user.type(screen.getByRole('textbox', { name: 'Firmen-ID' }), 'acme');
    await user.type(screen.getByRole('textbox', { name: 'Anzeigename' }), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Lobby beitreten' }));

    http
      .expectOne('/api/v1/players')
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBeTruthy();
    });
  });
});

// ─── validation ──────────────────────────────────────────────────────────────

describe('Entry – validation', () => {
  it('shows required validation errors when Join Lobby is submitted with empty fields', async () => {
    const user = userEvent.setup();
    await render(Entry, { providers: PROVIDERS });

    await user.click(screen.getByRole('button', { name: 'Lobby beitreten' }));

    await screen.findAllByText('Pflichtfeld');
  });
});

// ─── create lobby ────────────────────────────────────────────────────────────

describe('Entry – create lobby', () => {
  it('creates a lobby and navigates when Create Lobby is submitted', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Entry, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    await user.type(screen.getByRole('textbox', { name: 'Firmen-ID' }), 'acme');
    await user.type(screen.getByRole('textbox', { name: 'Anzeigename' }), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Lobby erstellen' }));

    http.expectOne('/api/v1/players').flush({ playerId: 'p1' });

    await waitFor(() => {
      expect(TestBed.inject(EntryStore).phase()).toBe('idle');
    });
    fixture.detectChanges();
  });
});

// ─── form submit prevention ──────────────────────────────────────────────────

describe('Entry – form submission', () => {
  it('prevents native form submission', async () => {
    await render(Entry, { providers: PROVIDERS });

    const form = document.querySelector('form');
    if (form === null) throw new Error('expected a form element');
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
