import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { HttpTestingController } from '@angular/common/http/testing';
import { sessionResolver } from './session.resolver';
import { SessionResponse } from '../backend-client';
import { provideTestEnvironment } from '../shared/testing';

function makeRoute(projectId: string, date: string): ActivatedRouteSnapshot {
  return { paramMap: convertToParamMap({ projectId, date }) } as unknown as ActivatedRouteSnapshot;
}

function makeSession(sessionId = 's1'): SessionResponse {
  return {
    sessionId,
    date: '2026-06-12',
    hostId: 'host-1',
    phase: 'Lobby',
    projectId: 'default',
    players: [],
    voting: { q1: { status: 'Open' }, q2: { status: 'Open' } },
  };
}

describe('sessionResolver', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...provideTestEnvironment(), provideRouter([])],
    });
  });

  it('redirects to / when the API returns 404', async () => {
    const route = makeRoute('default', '2026-06-12');
    const http = TestBed.inject(HttpTestingController);

    const promise = TestBed.runInInjectionContext(() =>
      sessionResolver(route, {} as RouterStateSnapshot),
    ) as Promise<SessionResponse | UrlTree>;

    http
      .expectOne('/api/v1/sessions/default/2026-06-12')
      .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('returns the session when the API succeeds', async () => {
    const route = makeRoute('default', '2026-06-12');
    const http = TestBed.inject(HttpTestingController);

    const promise = TestBed.runInInjectionContext(() =>
      sessionResolver(route, {} as RouterStateSnapshot),
    ) as Promise<SessionResponse | UrlTree>;

    http.expectOne('/api/v1/sessions/default/2026-06-12').flush(makeSession('s1'));

    const result = await promise;
    expect((result as SessionResponse).sessionId).toBe('s1');
  });
});
