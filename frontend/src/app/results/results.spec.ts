import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Results } from './results';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResultsResponse } from '../backend-client';

mockLocalStorage();

const drainMicrotasks = () =>
  new Promise<void>((r) => {
    queueMicrotask(r);
  });

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class LeaderboardStub {}

const PROVIDERS = [
  ...provideTestEnvironment(),
  provideRouter([{ path: 'leaderboard', component: LeaderboardStub }]),
];

function makeResults(overrides: Partial<SessionResultsResponse> = {}): SessionResultsResponse {
  return {
    sessionId: 's1',
    date: '2026-06-05',
    results: [],
    ...overrides,
  };
}

// ─── player table ─────────────────────────────────────────────────────────────

describe('Results – player table', () => {
  it('shows player display names from the results response', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Results, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/sessions/today').flush({ sessionId: 's1', phase: 'Ended' });
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(
      makeResults({
        results: [
          {
            playerId: 'p1',
            displayName: 'Alice',
            q1Correct: true,
            q2Correct: false,
            totalPoints: 1,
          },
          {
            playerId: 'p2',
            displayName: 'Bob',
            q1Correct: false,
            q2Correct: false,
            totalPoints: 0,
          },
        ],
      }),
    );
    await drainMicrotasks();
    fixture.detectChanges();

    screen.getByText('Alice');
    screen.getByText('Bob');
  });

  it('shows Q1 and Q2 correct indicators and total points per player', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const { fixture } = await render(Results, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/v1/sessions/today').flush({ sessionId: 's1', phase: 'Ended' });
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(
      makeResults({
        results: [
          {
            playerId: 'p1',
            displayName: 'Alice',
            q1Correct: true,
            q2Correct: true,
            totalPoints: 2,
          },
          {
            playerId: 'p2',
            displayName: 'Bob',
            q1Correct: false,
            q2Correct: false,
            totalPoints: 0,
          },
        ],
      }),
    );
    await drainMicrotasks();
    fixture.detectChanges();

    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });
});

// ─── Zum Leaderboard button ───────────────────────────────────────────────────

describe('Results – Zum Leaderboard button', () => {
  it('navigates to /leaderboard when button is clicked', async () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p1', companyId: 'acme', displayName: 'Alice' }),
    );
    const user = userEvent.setup();
    await render(Results, { providers: PROVIDERS });
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    http.expectOne('/api/v1/sessions/today').flush({ sessionId: 's1', phase: 'Ended' });
    await drainMicrotasks();
    http.expectOne('/api/v1/sessions/s1/results').flush(makeResults());

    const btn = screen.getByRole('button', { name: /leaderboard/i });
    await user.click(btn);

    expect(navigateSpy).toHaveBeenCalledWith(['/leaderboard']);
  });
});
