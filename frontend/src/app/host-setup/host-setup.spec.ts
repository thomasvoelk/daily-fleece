import { render, screen, fireEvent, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HostSetup } from './host-setup';
import { HostSetupStore } from './host-setup.store';
import {
  provideTestEnvironment,
  expectNoA11yViolations,
  mockLocalStorage,
} from '../shared/testing';

mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), HostSetupStore];

// ─── a11y ────────────────────────────────────────────────────────────────────

describe('HostSetup – a11y', () => {
  it('has no axe violations', async () => {
    const { container } = await render(HostSetup, { providers: PROVIDERS });
    await expectNoA11yViolations(container);
  });
});

// ─── initial state ───────────────────────────────────────────────────────────

describe('HostSetup – initial state', () => {
  it('"Create Session" button is aria-disabled when no files are selected', async () => {
    await render(HostSetup, { providers: PROVIDERS });
    expect(screen.getByRole('button', { name: 'Session erstellen' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});

// ─── file selection ──────────────────────────────────────────────────────────

describe('HostSetup – file selection', () => {
  it('does not update preview when a change event fires without a file', async () => {
    await render(HostSetup, { providers: PROVIDERS });

    const q1Input = screen.getByLabelText('F1 — Wissen (Kalenderblatt)');
    const q2Input = screen.getByLabelText('F2 — Geografie (Ort)');
    fireEvent.change(q1Input);
    fireEvent.change(q2Input);

    // "Create Session" remains disabled — no files were selected
    expect(screen.getByRole('button', { name: 'Session erstellen' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('"Create Session" button becomes enabled after both file pickers have a file', async () => {
    const user = userEvent.setup();
    await render(HostSetup, { providers: PROVIDERS });

    const q1Input = screen.getByLabelText('F1 — Wissen (Kalenderblatt)');
    const q2Input = screen.getByLabelText('F2 — Geografie (Ort)');

    await user.upload(q1Input, new File(['img'], 'q1.jpg', { type: 'image/jpeg' }));
    await user.upload(q2Input, new File(['img'], 'q2.jpg', { type: 'image/jpeg' }));

    expect(screen.getByRole('button', { name: 'Session erstellen' })).not.toBeDisabled();
  });
});

// ─── form submission ──────────────────────────────────────────────────────────

describe('HostSetup – form submission', () => {
  it('prevents native form submission', async () => {
    await render(HostSetup, { providers: PROVIDERS });

    const form = document.querySelector('form');
    if (form === null) throw new Error('expected a form element');
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});

// ─── error state ─────────────────────────────────────────────────────────────

describe('HostSetup – error state', () => {
  it('shows an error alert when session creation fails', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const user = userEvent.setup();
    await render(HostSetup, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(HostSetupStore).initialize('default', '2026-06-12');

    const q1Input = screen.getByLabelText('F1 — Wissen (Kalenderblatt)');
    const q2Input = screen.getByLabelText('F2 — Geografie (Ort)');
    await user.upload(q1Input, new File(['img'], 'q1.jpg', { type: 'image/jpeg' }));
    await user.upload(q2Input, new File(['img'], 'q2.jpg', { type: 'image/jpeg' }));

    await user.click(screen.getByRole('button', { name: 'Session erstellen' }));

    http
      .expectOne(() => true)
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBeTruthy();
    });
  });
});
