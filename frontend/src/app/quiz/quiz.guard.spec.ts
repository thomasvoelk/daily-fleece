import { TestBed } from '@angular/core/testing';
import { MaybeAsync, GuardResult, Router, UrlTree, provideRouter } from '@angular/router';
import { HttpTestingController } from '@angular/common/http/testing';
import { quizGuard } from './quiz.guard';
import { QuizStore } from './quiz.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResponse } from '../backend-client';

mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), QuizStore];

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

describe('quizGuard', () => {
  function runGuard(): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() => quizGuard({} as never, {} as never));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
  });

  it('redirects to /lobby when session fetch fails', async () => {
    const http = TestBed.inject(HttpTestingController);
    const today = '2026-06-12';

    const promise = runGuard() as Promise<GuardResult>;
    http
      .expectOne(`/api/v1/sessions/default/${today}`)
      .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    const result = await promise;

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/lobby');
  });

  it('redirects to /lobby when session is not Active', async () => {
    const http = TestBed.inject(HttpTestingController);
    const today = '2026-06-12';

    const promise = runGuard() as Promise<GuardResult>;
    http.expectOne(`/api/v1/sessions/default/${today}`).flush(makeSession({ phase: 'Lobby' }));
    const result = await promise;

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/lobby');
  });

  it('returns true and seeds the store when session is Active', async () => {
    const http = TestBed.inject(HttpTestingController);
    const store = TestBed.inject(QuizStore);
    const today = '2026-06-12';

    const promise = runGuard() as Promise<GuardResult>;
    http.expectOne(`/api/v1/sessions/default/${today}`).flush(makeSession({ sessionId: 'q42' }));
    const result = await promise;

    expect(result).toBe(true);
    expect(store.session()?.sessionId).toBe('q42');
  });
});
