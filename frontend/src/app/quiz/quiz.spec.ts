import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Quiz } from './quiz';
import { QuizStore } from './quiz.store';
import {
  provideTestEnvironment,
  expectNoA11yViolations,
  mockLocalStorage,
} from '../shared/testing';
import { SessionResponse } from '../backend-client';

mockLocalStorage();

function makeSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    sessionId: 's1',
    date: '2026-06-02',
    hostId: 'host-1',
    phase: 'Active',
    projectId: 'default',
    players: [],
    voting: { q1: { status: 'Open' }, q2: { status: 'Open' } },
    ...overrides,
  };
}

function makeStoreMock(
  overrides: Partial<InstanceType<typeof QuizStore>> = {},
): InstanceType<typeof QuizStore> {
  return {
    session: signal(makeSession()),
    answerCount: signal({ answered: 0, total: 0 }),
    q1Status: signal('Open' as const),
    q2Status: signal(null),
    myQ1Answer: signal(null),
    isHost: signal(false),
    submitQ1Answer: vi.fn(),
    refresh: vi.fn(),
    setQ1CorrectAnswer: vi.fn(),
    ...overrides,
  } as InstanceType<typeof QuizStore>;
}

async function renderQuiz(overrides: Parameters<typeof makeStoreMock>[0] = {}) {
  return render(Quiz, {
    providers: [
      ...provideTestEnvironment(),
      provideRouter([]),
      { provide: QuizStore, useValue: makeStoreMock(overrides) },
    ],
  });
}

// ─── a11y ────────────────────────────────────────────────────────────────────

describe('Quiz – a11y', () => {
  it('has no axe violations', async () => {
    const { container } = await renderQuiz();
    await expectNoA11yViolations(container);
  });
});

// ─── Q1 photo ────────────────────────────────────────────────────────────────

describe('Quiz – Q1 photo', () => {
  it('renders the photo for the active session', async () => {
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    const img = screen.getByRole('img', { name: /question 1/i });
    expect(img).toHaveAttribute('src', '/api/v1/sessions/abc/photos/q1');
  });
});

// ─── A/B/C answer radio buttons ──────────────────────────────────────────────

describe('Quiz – answer radio buttons', () => {
  it('shows A, B, C as radio inputs', async () => {
    await renderQuiz();

    const answerGroup = screen.getByRole('radiogroup', { name: /answer/i });
    within(answerGroup).getByRole('radio', { name: 'A' });
    within(answerGroup).getByRole('radio', { name: 'B' });
    within(answerGroup).getByRole('radio', { name: 'C' });
  });

  it("checks the radio matching the player's submitted answer", async () => {
    await renderQuiz({ myQ1Answer: signal('B' as const) });

    const answerGroup = screen.getByRole('radiogroup', { name: /answer/i });
    expect(within(answerGroup).getByRole('radio', { name: 'B' })).toBeChecked();
    expect(within(answerGroup).getByRole('radio', { name: 'A' })).not.toBeChecked();
    expect(within(answerGroup).getByRole('radio', { name: 'C' })).not.toBeChecked();
  });

  it('calls submitQ1Answer when a radio is clicked', async () => {
    const user = userEvent.setup();
    const submitQ1Answer = vi.fn();
    await renderQuiz({ submitQ1Answer });

    const answerGroup = screen.getByRole('radiogroup', { name: /answer/i });
    await user.click(within(answerGroup).getByRole('radio', { name: 'C' }));

    expect(submitQ1Answer).toHaveBeenCalledWith('C');
  });
});

// ─── Aktualisieren ───────────────────────────────────────────────────────────

describe('Quiz – Aktualisieren', () => {
  it('calls refresh when Aktualisieren is clicked', async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();
    await renderQuiz({ refresh });

    await user.click(screen.getByRole('button', { name: /refresh/i }));

    expect(refresh).toHaveBeenCalled();
  });
});

// ─── answer count ────────────────────────────────────────────────────────────

describe('Quiz – answer count', () => {
  it('shows answered/total beantwortet', async () => {
    await renderQuiz({ answerCount: signal({ answered: 1, total: 3 }) });

    screen.getByText(/1\/3 answered/i);
  });
});

// ─── host controls ───────────────────────────────────────────────────────────

describe('Quiz – host controls', () => {
  it('shows correct-answer picker and Abstimmung schließen for host', async () => {
    await renderQuiz({ isHost: signal(true) });

    const hostControls = screen.getByRole('region', { name: /host controls/i });
    within(hostControls).getByRole('radio', { name: 'A' });
    within(hostControls).getByRole('radio', { name: 'B' });
    within(hostControls).getByRole('radio', { name: 'C' });
    screen.getByRole('button', { name: /close voting/i });
  });

  it('hides host controls for a non-host player', async () => {
    await renderQuiz();

    expect(screen.queryByRole('button', { name: /close voting/i })).toBeNull();
  });

  it('Abstimmung schließen is disabled until a correct answer is selected', async () => {
    await renderQuiz({ isHost: signal(true) });

    expect(screen.getByRole('button', { name: /close voting/i })).toBeDisabled();
  });

  it('calls setQ1CorrectAnswer when Abstimmung schließen is clicked with selection', async () => {
    const user = userEvent.setup();
    const setQ1CorrectAnswer = vi.fn();
    await renderQuiz({ isHost: signal(true), setQ1CorrectAnswer });

    const hostControls = screen.getByRole('region', { name: /host controls/i });
    await user.click(within(hostControls).getByRole('radio', { name: 'B' }));
    await user.click(screen.getByRole('button', { name: /close voting/i }));

    expect(setQ1CorrectAnswer).toHaveBeenCalledWith('B');
  });
});

// ─── reveal state ────────────────────────────────────────────────────────────

describe('Quiz – reveal state', () => {
  it('shows correct answer and player answers when Q1 is Closed', async () => {
    await renderQuiz({
      q1Status: signal('Closed' as const),
      session: signal(
        makeSession({
          voting: {
            q1: {
              status: 'Closed',
              correctAnswer: 'A',
              answers: {
                p1: { answer: 'A', displayName: 'Alice' },
                p2: { answer: 'C', displayName: 'Bob' },
              },
            },
            q2: { status: 'Open' },
          },
        }),
      ),
    });

    screen.getByText(/correct answer/i);
    screen.getByText('Alice');
    screen.getByText('Bob');
  });

  it('does not show reveal section when Q1 is still Open', async () => {
    await renderQuiz();

    expect(screen.queryByText(/richtige antwort/i)).toBeNull();
  });
});

// ─── Q1 photo lightbox ───────────────────────────────────────────────────────

describe('Quiz – Q1 photo lightbox', () => {
  it('lightbox is not visible initially', async () => {
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking the Q1 photo opens the lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    await user.click(screen.getByRole('img', { name: 'Question 1' }));

    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('clicking the photo inside the lightbox closes it', async () => {
    const user = userEvent.setup();
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    await user.click(screen.getByRole('img', { name: 'Question 1' }));
    await user.click(screen.getByRole('img', { name: 'Question 1 enlarged' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking the close button closes the lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    await user.click(screen.getByRole('img', { name: 'Question 1' }));
    await user.click(screen.getByRole('button', { name: 'Close lightbox' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('pressing Enter on the Q1 photo button opens the lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    screen.getByRole('button', { name: 'Question 1' }).focus();
    await user.keyboard('[Enter]');

    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('pressing Escape closes the lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    await user.click(screen.getByRole('img', { name: 'Question 1' }));
    expect(screen.getByRole('img', { name: 'Question 1 enlarged' })).toBeVisible();

    await user.keyboard('[Escape]');

    expect(screen.queryByRole('img', { name: 'Question 1 enlarged' })).toBeNull();
  });
});

// ─── Q2 photo ────────────────────────────────────────────────────────────────

describe('Quiz – Q2 photo', () => {
  it('renders the Q2 photo when q2Status is Open', async () => {
    await renderQuiz({
      q2Status: signal('Open' as const),
      session: signal(makeSession({ sessionId: 'abc' })),
    });

    const img = screen.getByRole('img', { name: /question 2/i });
    expect(img).toHaveAttribute('src', '/api/v1/sessions/abc/photos/q2');
  });

  it('does not render the Q2 photo when q2Status is null', async () => {
    await renderQuiz();

    expect(screen.queryByRole('img', { name: /question 2/i })).toBeNull();
  });
});

// ─── Q2 photo lightbox ───────────────────────────────────────────────────────

describe('Quiz – Q2 photo lightbox', () => {
  it('Q2 lightbox is not visible initially', async () => {
    await renderQuiz({
      q2Status: signal('Open' as const),
      session: signal(makeSession({ sessionId: 'abc' })),
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking the Q2 photo opens the lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({
      q2Status: signal('Open' as const),
      session: signal(makeSession({ sessionId: 'abc' })),
    });

    await user.click(screen.getByRole('img', { name: 'Question 2' }));

    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('clicking the photo inside the Q2 lightbox closes it', async () => {
    const user = userEvent.setup();
    await renderQuiz({
      q2Status: signal('Open' as const),
      session: signal(makeSession({ sessionId: 'abc' })),
    });

    await user.click(screen.getByRole('img', { name: 'Question 2' }));
    await user.click(screen.getByRole('img', { name: 'Question 2 enlarged' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking the close button closes the Q2 lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({
      q2Status: signal('Open' as const),
      session: signal(makeSession({ sessionId: 'abc' })),
    });

    await user.click(screen.getByRole('img', { name: 'Question 2' }));
    await user.click(screen.getByRole('button', { name: 'Close lightbox' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('pressing Escape closes the Q2 lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({
      q2Status: signal('Open' as const),
      session: signal(makeSession({ sessionId: 'abc' })),
    });

    await user.click(screen.getByRole('img', { name: 'Question 2' }));
    expect(screen.getByRole('img', { name: 'Question 2 enlarged' })).toBeVisible();

    await user.keyboard('[Escape]');

    expect(screen.queryByRole('img', { name: 'Question 2 enlarged' })).toBeNull();
  });
});

// ─── no-answer prompt ────────────────────────────────────────────────────────

describe('Quiz – no-answer prompt', () => {
  it('shows prompt when Q1 is Open and player has not answered', async () => {
    await renderQuiz();

    screen.getByText(/please choose your answer/i);
  });

  it('hides prompt once player has answered', async () => {
    await renderQuiz({ myQ1Answer: signal('A' as const) });

    expect(screen.queryByText(/please choose your answer/i)).toBeNull();
  });
});
