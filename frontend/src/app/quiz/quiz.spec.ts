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
import { ApiConfiguration, SessionResponse } from '../backend-client';

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
    q2AnswerCount: signal({ answered: 0, total: 0 }),
    q1Status: signal('Open' as const),
    q2Status: signal(null),
    myQ1Answer: signal(null),
    myQ2Answer: signal(null),
    isHost: signal(false),
    activeQuestion: signal('q1' as const),
    submitQ1Answer: vi.fn(),
    submitQ2Answer: vi.fn(),
    refresh: vi.fn(),
    setQ1CorrectAnswer: vi.fn(),
    setQ2CorrectAnswer: vi.fn(),
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

  it('has no axe violations in host Q2 voting state', async () => {
    const { container } = await renderQuiz({
      isHost: signal(true),
      q1Status: signal('Closed' as const),
      q2Status: signal('Open' as const),
    });
    await expectNoA11yViolations(container);
  });
});

// ─── no session ──────────────────────────────────────────────────────────────

describe('Quiz – no session', () => {
  it('renders nothing when there is no session', async () => {
    const { container } = await renderQuiz({ session: signal(null) });
    expect(container.querySelector('main')?.textContent.trim()).toBe('');
  });

  it('photoUrl() returns an empty string when there is no session', async () => {
    const { fixture } = await renderQuiz({ session: signal(null) });
    const instance = fixture.componentInstance as unknown as {
      photoUrl: (question: 'q1' | 'q2') => string;
    };
    expect(instance.photoUrl('q1')).toBe('');
  });
});

// ─── Q1 photo ────────────────────────────────────────────────────────────────

describe('Quiz – Q1 photo', () => {
  it('renders the photo for the active session', async () => {
    await renderQuiz({ session: signal(makeSession()) });

    const img = screen.getByRole('img', { name: 'Frage 1' });
    expect(img).toHaveAttribute('src', '/api/v1/sessions/default/2026-06-02/photos/q1');
  });

  it('derives the Q1 photo URL from ApiConfiguration.rootUrl', async () => {
    const config = new ApiConfiguration();
    config.rootUrl = '/proxy/api/v2';

    await render(Quiz, {
      providers: [
        ...provideTestEnvironment(),
        provideRouter([]),
        {
          provide: QuizStore,
          useValue: makeStoreMock({ session: signal(makeSession()) }),
        },
        { provide: ApiConfiguration, useValue: config },
      ],
    });

    expect(screen.getByRole('img', { name: 'Frage 1' })).toHaveAttribute(
      'src',
      '/proxy/api/v2/sessions/default/2026-06-02/photos/q1',
    );
  });
});

// ─── A/B/C answer radio buttons ──────────────────────────────────────────────

describe('Quiz – answer radio buttons', () => {
  it('shows A, B, C as radio inputs', async () => {
    await renderQuiz();

    const answerGroup = screen.getByRole('radiogroup', { name: 'Antwort auswählen' });
    within(answerGroup).getByRole('radio', { name: 'A' });
    within(answerGroup).getByRole('radio', { name: 'B' });
    within(answerGroup).getByRole('radio', { name: 'C' });
  });

  it("checks the radio matching the player's submitted answer", async () => {
    await renderQuiz({ myQ1Answer: signal('B' as const) });

    const answerGroup = screen.getByRole('radiogroup', { name: 'Antwort auswählen' });
    expect(within(answerGroup).getByRole('radio', { name: 'B' })).toBeChecked();
    expect(within(answerGroup).getByRole('radio', { name: 'A' })).not.toBeChecked();
    expect(within(answerGroup).getByRole('radio', { name: 'C' })).not.toBeChecked();
  });

  it('hides Q1 A/B/C radio group when Q2 voting is open', async () => {
    await renderQuiz({ q1Status: signal('Closed' as const), q2Status: signal('Open' as const) });
    expect(screen.queryByRole('radiogroup', { name: 'Antwort auswählen' })).toBeNull();
  });

  it('hides Q1 A/B/C radio group when Q1 voting is Closed', async () => {
    await renderQuiz({ q1Status: signal('Closed' as const) });
    expect(screen.queryByRole('radiogroup', { name: 'Antwort auswählen' })).toBeNull();
  });

  it('calls submitQ1Answer when a radio is clicked', async () => {
    const user = userEvent.setup();
    const submitQ1Answer = vi.fn();
    await renderQuiz({ submitQ1Answer });

    const answerGroup = screen.getByRole('radiogroup', { name: 'Antwort auswählen' });
    await user.click(within(answerGroup).getByRole('radio', { name: 'C' }));

    expect(submitQ1Answer).toHaveBeenCalledWith('C');
  });
});

// ─── refresh button ───────────────────────────────────────────────────────────

describe('Quiz – refresh button', () => {
  it('shows "Refresh" during voting and calls refresh when clicked', async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();
    await renderQuiz({ refresh });

    await user.click(screen.getByRole('button', { name: 'Neu laden' }));

    expect(refresh).toHaveBeenCalled();
  });
});

// ─── answer count ────────────────────────────────────────────────────────────

describe('Quiz – answer count', () => {
  it('shows answered/total beantwortet', async () => {
    await renderQuiz({ answerCount: signal({ answered: 1, total: 3 }) });

    screen.getByText(/1\/3 beantwortet/i);
  });
});

// ─── Q2 answer count ─────────────────────────────────────────────────────────

describe('Quiz – Q2 answer count', () => {
  it('shows Q2 answered/total when Q2 is open', async () => {
    await renderQuiz({
      q2Status: signal('Open' as const),
      q2AnswerCount: signal({ answered: 2, total: 4 }),
    });

    screen.getByText(/2\/4 beantwortet/i);
  });

  it('shows Q2 count and not Q1 count when Q2 is open', async () => {
    await renderQuiz({
      q2Status: signal('Open' as const),
      answerCount: signal({ answered: 1, total: 5 }),
      q2AnswerCount: signal({ answered: 3, total: 5 }),
    });

    screen.getByText(/3\/5 beantwortet/i);
    expect(screen.queryByText(/1\/5 beantwortet/i)).toBeNull();
  });

  it('shows Q1 count when Q2 is not open', async () => {
    await renderQuiz({
      q2Status: signal(null),
      answerCount: signal({ answered: 1, total: 5 }),
      q2AnswerCount: signal({ answered: 3, total: 5 }),
    });

    screen.getByText(/1\/5 beantwortet/i);
    expect(screen.queryByText(/3\/5 beantwortet/i)).toBeNull();
  });
});

// ─── host controls ───────────────────────────────────────────────────────────

describe('Quiz – host controls', () => {
  it('shows correct-answer picker and Abstimmung schließen for host', async () => {
    await renderQuiz({ isHost: signal(true) });

    const hostControls = screen.getByRole('region', { name: 'Host-Steuerung' });
    within(hostControls).getByRole('radio', { name: 'A' });
    within(hostControls).getByRole('radio', { name: 'B' });
    within(hostControls).getByRole('radio', { name: 'C' });
    screen.getByRole('button', { name: 'Abstimmung schließen' });
  });

  it('shows country picker and close Q2 voting button for host when Q2 is open', async () => {
    await renderQuiz({
      isHost: signal(true),
      q1Status: signal('Closed' as const),
      q2Status: signal('Open' as const),
    });

    const hostControls = screen.getByRole('region', { name: 'Host-Steuerung' });
    within(hostControls).getByRole('combobox', { name: 'Richtige Antwort' });
    screen.getByRole('button', { name: 'Abstimmung schließen' });
  });

  it('close Q2 voting button is aria-disabled when no country is selected', async () => {
    await renderQuiz({
      isHost: signal(true),
      q1Status: signal('Closed' as const),
      q2Status: signal('Open' as const),
    });

    expect(screen.getByRole('button', { name: 'Abstimmung schließen' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('hides host controls for a non-host player', async () => {
    await renderQuiz();

    expect(screen.queryByRole('button', { name: 'Abstimmung schließen' })).toBeNull();
  });

  it('hides host controls section when both questions are already Closed', async () => {
    await renderQuiz({
      isHost: signal(true),
      q1Status: signal('Closed' as const),
      q2Status: signal('Closed' as const),
    });

    expect(screen.queryByRole('region', { name: 'Host-Steuerung' })).toBeNull();
  });

  it('Abstimmung schließen is disabled until a correct answer is selected', async () => {
    await renderQuiz({ isHost: signal(true) });

    expect(screen.getByRole('button', { name: 'Abstimmung schließen' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('calls setQ2CorrectAnswer when close Q2 voting is clicked with a country selected', async () => {
    const user = userEvent.setup();
    const setQ2CorrectAnswer = vi.fn();
    await renderQuiz({
      isHost: signal(true),
      q1Status: signal('Closed' as const),
      q2Status: signal('Open' as const),
      setQ2CorrectAnswer,
    });

    const hostControls = screen.getByRole('region', { name: 'Host-Steuerung' });
    const input = within(hostControls).getByRole('combobox', { name: 'Richtige Antwort' });
    await user.click(input);
    const options = screen.getAllByRole('option');
    await user.click(options[0]);
    await user.click(screen.getByRole('button', { name: 'Abstimmung schließen' }));

    expect(setQ2CorrectAnswer).toHaveBeenCalledWith(expect.any(String));
  });

  it('typing in the host country combobox filters the options list', async () => {
    const user = userEvent.setup();
    await renderQuiz({
      isHost: signal(true),
      q1Status: signal('Closed' as const),
      q2Status: signal('Open' as const),
    });

    const hostControls = screen.getByRole('region', { name: 'Host-Steuerung' });
    const input = within(hostControls).getByRole('combobox', { name: 'Richtige Antwort' });
    await user.click(input);
    await user.type(input, 'deutsch');

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.textContent.toLowerCase().includes('deutsch'))).toBe(true);
  });

  it('calls setQ1CorrectAnswer when Abstimmung schließen is clicked with selection', async () => {
    const user = userEvent.setup();
    const setQ1CorrectAnswer = vi.fn();
    await renderQuiz({ isHost: signal(true), setQ1CorrectAnswer });

    const hostControls = screen.getByRole('region', { name: 'Host-Steuerung' });
    await user.click(within(hostControls).getByRole('radio', { name: 'B' }));
    await user.click(screen.getByRole('button', { name: 'Abstimmung schließen' }));

    expect(setQ1CorrectAnswer).toHaveBeenCalledWith('B');
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

    await user.click(screen.getByRole('img', { name: 'Frage 1' }));

    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('clicking the photo inside the lightbox closes it', async () => {
    const user = userEvent.setup();
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    await user.click(screen.getByRole('img', { name: 'Frage 1' }));
    await user.click(screen.getByRole('img', { name: 'Frage 1 vergrößert' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking the close button closes the lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    await user.click(screen.getByRole('img', { name: 'Frage 1' }));
    await user.click(screen.getByRole('button', { name: 'Lightbox schließen' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('pressing Enter on the Q1 photo button opens the lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    screen.getByRole('button', { name: 'Frage 1' }).focus();
    await user.keyboard('[Enter]');

    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('pressing Escape closes the lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    await user.click(screen.getByRole('img', { name: 'Frage 1' }));
    expect(screen.getByRole('img', { name: 'Frage 1 vergrößert' })).toBeVisible();

    await user.keyboard('[Escape]');

    expect(screen.queryByRole('img', { name: 'Frage 1 vergrößert' })).toBeNull();
  });

  it('pressing Escape while focus is inside the dialog closes it', async () => {
    const user = userEvent.setup();
    await renderQuiz({ session: signal(makeSession({ sessionId: 'abc' })) });

    await user.click(screen.getByRole('img', { name: 'Frage 1' }));
    screen.getByRole('dialog').focus();

    await user.keyboard('[Escape]');

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

// ─── Q2 photo ────────────────────────────────────────────────────────────────

describe('Quiz – Q2 photo', () => {
  it('renders the Q2 photo when q2Status is Open', async () => {
    await renderQuiz({
      q2Status: signal('Open' as const),
      session: signal(makeSession()),
    });

    const img = screen.getByRole('img', { name: 'Frage 2' });
    expect(img).toHaveAttribute('src', '/api/v1/sessions/default/2026-06-02/photos/q2');
  });

  it('does not render the Q2 photo when q2Status is null', async () => {
    await renderQuiz();

    expect(screen.queryByRole('img', { name: 'Frage 2' })).toBeNull();
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

    await user.click(screen.getByRole('img', { name: 'Frage 2' }));

    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('clicking the photo inside the Q2 lightbox closes it', async () => {
    const user = userEvent.setup();
    await renderQuiz({
      q2Status: signal('Open' as const),
      session: signal(makeSession({ sessionId: 'abc' })),
    });

    await user.click(screen.getByRole('img', { name: 'Frage 2' }));
    await user.click(screen.getByRole('img', { name: 'Frage 2 vergrößert' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking the close button closes the Q2 lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({
      q2Status: signal('Open' as const),
      session: signal(makeSession({ sessionId: 'abc' })),
    });

    await user.click(screen.getByRole('img', { name: 'Frage 2' }));
    await user.click(screen.getByRole('button', { name: 'Lightbox schließen' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('pressing Escape closes the Q2 lightbox', async () => {
    const user = userEvent.setup();
    await renderQuiz({
      q2Status: signal('Open' as const),
      session: signal(makeSession({ sessionId: 'abc' })),
    });

    await user.click(screen.getByRole('img', { name: 'Frage 2' }));
    expect(screen.getByRole('img', { name: 'Frage 2 vergrößert' })).toBeVisible();

    await user.keyboard('[Escape]');

    expect(screen.queryByRole('img', { name: 'Frage 2 vergrößert' })).toBeNull();
  });
});

// ─── Q2 country input ────────────────────────────────────────────────────────

describe('Quiz – Q2 country input', () => {
  it('shows country combobox when q2Status is Open', async () => {
    await renderQuiz({ q2Status: signal('Open' as const) });

    screen.getByRole('combobox', { name: 'Deine Antwort' });
  });

  it('hides country combobox when q2Status is not Open', async () => {
    await renderQuiz();

    expect(screen.queryByRole('combobox', { name: 'Deine Antwort' })).toBeNull();
  });

  it('selecting a country option calls submitQ2Answer with the ISO code', async () => {
    const user = userEvent.setup();
    const submitQ2Answer = vi.fn();
    await renderQuiz({ q2Status: signal('Open' as const), submitQ2Answer });

    const input = screen.getByRole('combobox', { name: 'Deine Antwort' });
    await user.click(input);
    await user.type(input, 'deutsch');
    const option = screen.getAllByRole('option')[0];
    await user.click(option);

    expect(submitQ2Answer).toHaveBeenCalledWith('DE');
  });

  it('typing in the combobox filters the options list', async () => {
    const user = userEvent.setup();
    await renderQuiz({ q2Status: signal('Open' as const) });

    const input = screen.getByRole('combobox', { name: 'Deine Antwort' });
    await user.click(input);
    await user.type(input, 'deutsch');

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.textContent.toLowerCase().includes('deutsch'))).toBe(true);
  });
});

// ─── category chip ───────────────────────────────────────────────────────────

describe('Quiz – category chip', () => {
  it('shows KNOWLEDGE chip during Q1 voting', async () => {
    await renderQuiz({ q1Status: signal('Open' as const) });
    screen.getByText('WER WEISS DENN SOWAS?');
  });

  it('hides the KNOWLEDGE chip when Q1 voting is Closed', async () => {
    await renderQuiz({
      q1Status: signal('Closed' as const),
      q2Status: signal(null),
    });
    expect(screen.queryByText('WER WEISS DENN SOWAS?')).toBeNull();
  });

  it('shows GEOGRAPHY chip during Q2 voting', async () => {
    await renderQuiz({ q2Status: signal('Open' as const) });
    screen.getByText('ERDKUNDE');
  });

  it('hides the GEOGRAPHY chip when Q2 voting is Closed', async () => {
    await renderQuiz({
      q1Status: signal('Closed' as const),
      q2Status: signal('Closed' as const),
    });
    expect(screen.queryByText('ERDKUNDE')).toBeNull();
  });
});

// ─── Ended session: personal highlight ───────────────────────────────────────

describe('Quiz – Ended Q2: personal highlight', () => {
  const endedSession = makeSession({
    phase: 'Ended',
    voting: { q1: { status: 'Closed' }, q2: { status: 'Closed' } },
  });

  it("shows the player's submitted q2 country answer highlighted in the Ended view", async () => {
    await renderQuiz({
      session: signal(endedSession),
      q1Status: signal('Closed' as const),
      q2Status: signal('Closed' as const),
      myQ2Answer: signal('FR'),
      activeQuestion: signal('q2' as const),
    });

    expect(screen.getByText('Frankreich')).toHaveAttribute('aria-current', 'true');
  });

  it('shows no highlighted country when player has no submitted q2 answer', async () => {
    await renderQuiz({
      session: signal(endedSession),
      q1Status: signal('Closed' as const),
      q2Status: signal('Closed' as const),
      myQ2Answer: signal(null),
      activeQuestion: signal('q2' as const),
    });

    expect(screen.queryByRole('mark')).toBeNull();
  });
});

describe('Quiz – Ended Q1: personal highlight', () => {
  const endedSession = makeSession({
    phase: 'Ended',
    voting: { q1: { status: 'Closed' }, q2: { status: 'Closed' } },
  });

  it("shows the player's submitted q1 answer highlighted (aria-current) in the Ended view", async () => {
    await renderQuiz({
      session: signal(endedSession),
      q1Status: signal('Closed' as const),
      q2Status: signal('Closed' as const),
      myQ1Answer: signal('B' as const),
      activeQuestion: signal('q1' as const),
    });

    const list = screen.getByRole('list', { name: 'Deine Antwort auf Frage 1' });
    expect(within(list).getByRole('listitem', { name: 'B' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(within(list).getByRole('listitem', { name: 'A' })).not.toHaveAttribute('aria-current');
    expect(within(list).getByRole('listitem', { name: 'C' })).not.toHaveAttribute('aria-current');
  });

  it('shows no highlighted option for q1 when player has no submitted answer', async () => {
    await renderQuiz({
      session: signal(endedSession),
      q1Status: signal('Closed' as const),
      q2Status: signal('Closed' as const),
      myQ1Answer: signal(null),
      activeQuestion: signal('q1' as const),
    });

    const list = screen.getByRole('list', { name: 'Deine Antwort auf Frage 1' });
    within(list)
      .getAllByRole('listitem')
      .forEach((item) => {
        expect(item).not.toHaveAttribute('aria-current');
      });
  });
});
