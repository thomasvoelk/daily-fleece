import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter } from '@angular/router';
import { HostSetup } from './host-setup';
import { HostSetupStore } from './host-setup.store';
import { EntryStore } from '../entry/entry.store';
import { provideTestEnvironment } from '../../testing/providers';
import { mockLocalStorage } from '../../testing/local-storage';

mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), EntryStore, HostSetupStore];

// ─── initial state ───────────────────────────────────────────────────────────

describe('HostSetup – initial state', () => {
  it('"Create Session" button is disabled when no files are selected', async () => {
    await render(HostSetup, { providers: PROVIDERS });
    expect(screen.getByRole('button', { name: /create session/i })).toBeDisabled();
  });
});

// ─── file selection ──────────────────────────────────────────────────────────

describe('HostSetup – file selection', () => {
  it('"Create Session" button becomes enabled after both file pickers have a file', async () => {
    const user = userEvent.setup();
    await render(HostSetup, { providers: PROVIDERS });

    const q1Input = screen.getByLabelText(/q1|knowledge/i);
    const q2Input = screen.getByLabelText(/q2|geography/i);

    await user.upload(q1Input, new File(['img'], 'q1.jpg', { type: 'image/jpeg' }));
    await user.upload(q2Input, new File(['img'], 'q2.jpg', { type: 'image/jpeg' }));

    expect(screen.getByRole('button', { name: /create session/i })).not.toBeDisabled();
  });
});
