import { render, screen, fireEvent } from '@testing-library/angular';
import { QuizHostReveal } from './quiz-host-reveal';
import { provideTestEnvironment, mockLocalStorage } from '../../shared/testing';

mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment()];

// ─── Q1 close guard ──────────────────────────────────────────────────────────

describe('QuizHostReveal – close Q1 guard', () => {
  it('does not emit closeQ1Voting when no answer has been selected', async () => {
    const { fixture } = await render(QuizHostReveal, {
      providers: PROVIDERS,
      inputs: { q1Status: 'Open', q2Status: 'Closed' },
    });
    const closeQ1Spy = vi.fn();
    fixture.componentInstance.closeQ1Voting.subscribe(closeQ1Spy);

    fireEvent.click(screen.getByRole('button', { name: 'Abstimmung schließen' }));

    expect(closeQ1Spy).not.toHaveBeenCalled();
  });
});

// ─── Q2 close guard ──────────────────────────────────────────────────────────

describe('QuizHostReveal – close Q2 guard', () => {
  it('does not emit closeQ2Voting when no country has been selected', async () => {
    const { fixture } = await render(QuizHostReveal, {
      providers: PROVIDERS,
      inputs: { q1Status: 'Closed', q2Status: 'Open' },
    });
    const closeQ2Spy = vi.fn();
    fixture.componentInstance.closeQ2Voting.subscribe(closeQ2Spy);

    fireEvent.click(screen.getByRole('button', { name: 'Abstimmung schließen' }));

    expect(closeQ2Spy).not.toHaveBeenCalled();
  });
});
