import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
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
    expect(screen.getByRole('button', { name: /session erstellen/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});

// ─── file selection ──────────────────────────────────────────────────────────

describe('HostSetup – file selection', () => {
  it('does not update preview when a change event fires without a file', async () => {
    await render(HostSetup, { providers: PROVIDERS });

    const q1Input = screen.getByLabelText(/f1|wissen/i);
    const q2Input = screen.getByLabelText(/f2|geografie/i);
    fireEvent.change(q1Input);
    fireEvent.change(q2Input);

    // "Create Session" remains disabled — no files were selected
    expect(screen.getByRole('button', { name: /session erstellen/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('"Create Session" button becomes enabled after both file pickers have a file', async () => {
    const user = userEvent.setup();
    await render(HostSetup, { providers: PROVIDERS });

    const q1Input = screen.getByLabelText(/f1|wissen/i);
    const q2Input = screen.getByLabelText(/f2|geografie/i);

    await user.upload(q1Input, new File(['img'], 'q1.jpg', { type: 'image/jpeg' }));
    await user.upload(q2Input, new File(['img'], 'q2.jpg', { type: 'image/jpeg' }));

    expect(screen.getByRole('button', { name: /session erstellen/i })).not.toBeDisabled();
  });
});
