import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Quiz } from './quiz';
import { QuizStore } from './quiz.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
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

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), QuizStore];

// ─── Q1 photo ────────────────────────────────────────────────────────────────

describe('Quiz – Q1 photo', () => {
  it('renders the photo for the active session', async () => {
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession({ sessionId: 'abc' }));
    fixture.detectChanges();

    const img = screen.getByRole('img', { name: /frage 1/i });
    expect(img).toHaveAttribute('src', '/api/v1/sessions/abc/photos/q1');
  });
});

// ─── A/B/C answer buttons ────────────────────────────────────────────────────

describe('Quiz – answer buttons', () => {
  it('shows A, B, C answer buttons', async () => {
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession());
    fixture.detectChanges();

    screen.getByRole('button', { name: 'A' });
    screen.getByRole('button', { name: 'B' });
    screen.getByRole('button', { name: 'C' });
  });

  it('highlights the selected answer', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(
      makeSession({
        voting: {
          q1: { status: 'Open', answers: { p1: { answer: 'B', displayName: 'Alice' } } },
          q2: { status: 'Open' },
        },
      }),
    );
    fixture.detectChanges();

    expect(screen.getByRole('button', { name: 'B' })).toHaveClass('selected');
    expect(screen.getByRole('button', { name: 'A' })).not.toHaveClass('selected');
    expect(screen.getByRole('button', { name: 'C' })).not.toHaveClass('selected');
  });

  it('calls submitQ1Answer when a button is clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    vi.spyOn(store, 'submitQ1Answer').mockResolvedValue(undefined);
    store.initializeSession(makeSession());
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: 'C' }));

    expect(store.submitQ1Answer).toHaveBeenCalledWith('C');
  });
});

// ─── Aktualisieren ───────────────────────────────────────────────────────────

describe('Quiz – Aktualisieren', () => {
  it('calls refresh when Aktualisieren is clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    vi.spyOn(store, 'refresh').mockResolvedValue(undefined);
    store.initializeSession(makeSession());
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: /aktualisieren/i }));

    expect(store.refresh).toHaveBeenCalled();
  });
});

// ─── answer count ────────────────────────────────────────────────────────────

describe('Quiz – answer count', () => {
  it('shows answered/total beantwortet', async () => {
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(
      makeSession({
        players: [
          { playerId: 'p1', displayName: 'Alice' },
          { playerId: 'p2', displayName: 'Bob' },
          { playerId: 'p3', displayName: 'Carl' },
        ],
        voting: {
          q1: { status: 'Open', answerCount: 1 },
          q2: { status: 'Open' },
        },
      }),
    );
    fixture.detectChanges();

    screen.getByText(/1\/3 beantwortet/i);
  });
});

// ─── host controls ───────────────────────────────────────────────────────────

describe('Quiz – host controls', () => {
  it('shows correct-answer picker and Abstimmung schließen for host', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Host' }),
    );
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession({ hostId: 'host-1' }));
    fixture.detectChanges();

    screen.getByRole('radio', { name: 'A' });
    screen.getByRole('radio', { name: 'B' });
    screen.getByRole('radio', { name: 'C' });
    screen.getByRole('button', { name: /abstimmung schließen/i });
  });

  it('hides host controls for a non-host player', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'player-2', companyId: 'acme', displayName: 'Bob' }),
    );
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession({ hostId: 'host-1' }));
    fixture.detectChanges();

    expect(screen.queryByRole('button', { name: /abstimmung schließen/i })).toBeNull();
  });

  it('Abstimmung schließen is disabled until a correct answer is selected', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Host' }),
    );
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession({ hostId: 'host-1' }));
    fixture.detectChanges();

    expect(screen.getByRole('button', { name: /abstimmung schließen/i })).toBeDisabled();
  });

  it('calls setQ1CorrectAnswer when Abstimmung schließen is clicked with selection', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'host-1', companyId: 'acme', displayName: 'Host' }),
    );
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    const store = TestBed.inject(QuizStore);
    vi.spyOn(store, 'setQ1CorrectAnswer').mockResolvedValue(undefined);
    store.initializeSession(makeSession({ hostId: 'host-1' }));
    fixture.detectChanges();

    await user.click(screen.getByRole('radio', { name: 'B' }));
    await user.click(screen.getByRole('button', { name: /abstimmung schließen/i }));

    expect(store.setQ1CorrectAnswer).toHaveBeenCalledWith('B');
  });
});

// ─── reveal state ────────────────────────────────────────────────────────────

describe('Quiz – reveal state', () => {
  it('shows correct answer and player answers when Q1 is Closed', async () => {
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(
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
    );
    fixture.detectChanges();

    screen.getByText(/richtige antwort/i);
    screen.getByText('Alice');
    screen.getByText('Bob');
  });

  it('does not show reveal section when Q1 is still Open', async () => {
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession());
    fixture.detectChanges();

    expect(screen.queryByText(/richtige antwort/i)).toBeNull();
  });
});

// ─── Q1 photo lightbox ───────────────────────────────────────────────────────

describe('Quiz – Q1 photo lightbox', () => {
  it('lightbox overlay is not visible initially', async () => {
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession({ sessionId: 'abc' }));
    fixture.detectChanges();

    expect(screen.queryByRole('img', { name: 'Frage 1 vergrößert' })).toBeNull();
  });

  it('clicking the Q1 photo opens the lightbox overlay', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession({ sessionId: 'abc' }));
    fixture.detectChanges();

    await user.click(screen.getByRole('img', { name: 'Frage 1' }));

    expect(screen.getByRole('img', { name: 'Frage 1 vergrößert' })).toBeVisible();
  });

  it('clicking the photo inside the overlay closes the lightbox', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession({ sessionId: 'abc' }));
    fixture.detectChanges();

    await user.click(screen.getByRole('img', { name: 'Frage 1' }));
    await user.click(screen.getByRole('img', { name: 'Frage 1 vergrößert' }));

    expect(screen.queryByRole('img', { name: 'Frage 1 vergrößert' })).toBeNull();
  });

  it('clicking the close button closes the lightbox', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession({ sessionId: 'abc' }));
    fixture.detectChanges();

    await user.click(screen.getByRole('img', { name: 'Frage 1' }));
    await user.click(screen.getByRole('button', { name: 'Close lightbox' }));

    expect(screen.queryByRole('img', { name: 'Frage 1 vergrößert' })).toBeNull();
  });
});

// ─── no-answer prompt ────────────────────────────────────────────────────────

describe('Quiz – no-answer prompt', () => {
  it('shows prompt when Q1 is Open and player has not answered', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(makeSession());
    fixture.detectChanges();

    screen.getByText(/bitte wähle deine antwort/i);
  });

  it('hides prompt once player has answered', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Quiz, { providers: PROVIDERS });
    TestBed.inject(QuizStore).initializeSession(
      makeSession({
        voting: {
          q1: { status: 'Open', answers: { p1: { answer: 'A', displayName: 'Alice' } } },
          q2: { status: 'Open' },
        },
      }),
    );
    fixture.detectChanges();

    expect(screen.queryByText(/bitte wähle deine antwort/i)).toBeNull();
  });
});
