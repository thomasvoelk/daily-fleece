import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  MaybeAsync,
  GuardResult,
  Router,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { HttpTestingController } from '@angular/common/http/testing';
import { quizGuard } from './quiz.guard';
import { QuizStore } from './quiz.store';
import { EntryContext } from '../entry';
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

function makeRoute(
  session: SessionResponse | null,
  urlSegment: 'q1' | 'q2' = 'q1',
): ActivatedRouteSnapshot {
  return {
    data: { session },
    url: [{ path: urlSegment }],
  } as unknown as ActivatedRouteSnapshot;
}

describe('quizGuard', () => {
  let playerId: WritableSignal<string | null>;

  function runGuard(
    session: SessionResponse | null = makeSession(),
    urlSegment: 'q1' | 'q2' = 'q1',
  ): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() =>
      quizGuard(makeRoute(session, urlSegment), {} as never),
    );
  }

  beforeEach(() => {
    playerId = signal(null);
    TestBed.configureTestingModule({
      providers: [
        ...provideTestEnvironment(),
        provideRouter([]),
        QuizStore,
        { provide: EntryContext, useValue: { playerId } },
      ],
    });
  });

  it('redirects to / when session is null', async () => {
    playerId.set('p1');
    const result = await runGuard(null);
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirects to / when Active session and no identity', async () => {
    const result = await runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('returns true and seeds the store when Active session with identity', async () => {
    playerId.set('p1');
    const store = TestBed.inject(QuizStore);
    const result = await runGuard(makeSession({ sessionId: 'q42' }));
    expect(result).toBe(true);
    expect(store.session()?.sessionId).toBe('q42');
  });

  it('redirects to /q2 when on q1 route but Q1 is Closed and Q2 is Open', async () => {
    playerId.set('p1');
    const session = makeSession({
      voting: { q1: { status: 'Closed' }, q2: { status: 'Open' } },
    });
    const result = await runGuard(session, 'q1');
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/session/default/2026-06-02/q2',
    );
  });

  it('redirects to /q1 when on q2 route but Q2 is Closed and Q1 is Open', async () => {
    playerId.set('p1');
    const session = makeSession({
      voting: { q1: { status: 'Open' }, q2: { status: 'Closed' } },
    });
    const result = await runGuard(session, 'q2');
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/session/default/2026-06-02/q1',
    );
  });

  it('allows /q1 access for Ended session without identity', async () => {
    const result = await runGuard(makeSession({ phase: 'Ended' }), 'q1');
    expect(result).toBe(true);
  });

  it('allows /q2 access for Ended session without identity', async () => {
    const result = await runGuard(makeSession({ phase: 'Ended' }), 'q2');
    expect(result).toBe(true);
  });

  it('defaults to q1 when route.url is empty', async () => {
    playerId.set('p1');
    const route = {
      data: { session: makeSession() },
      url: [],
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => quizGuard(route, {} as never));

    expect(result).toBe(true);
    expect(TestBed.inject(QuizStore).activeQuestion()).toBe('q1');
  });

  it('fetches the session via the API using route.parent params when route.data has no session', async () => {
    playerId.set('p1');
    const route = {
      data: {},
      url: [{ path: 'q1' }],
      parent: { paramMap: convertToParamMap({ projectId: 'default', date: '2026-06-02' }) },
    } as unknown as ActivatedRouteSnapshot;

    const http = TestBed.inject(HttpTestingController);
    const promise = TestBed.runInInjectionContext(() => quizGuard(route, {} as never));
    http.expectOne('/api/v1/sessions/default/2026-06-02').flush(makeSession());

    expect(await promise).toBe(true);
  });

  it('redirects to / when route.parent is missing projectId/date and route.data has no session', async () => {
    const route = {
      data: {},
      url: [{ path: 'q1' }],
      parent: { paramMap: convertToParamMap({}) },
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() => quizGuard(route, {} as never));

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirects to / when the API call fails', async () => {
    const route = {
      data: {},
      url: [{ path: 'q1' }],
      parent: { paramMap: convertToParamMap({ projectId: 'default', date: '2026-06-02' }) },
    } as unknown as ActivatedRouteSnapshot;

    const http = TestBed.inject(HttpTestingController);
    const promise = TestBed.runInInjectionContext(() => quizGuard(route, {} as never));
    http
      .expectOne('/api/v1/sessions/default/2026-06-02')
      .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });
});
