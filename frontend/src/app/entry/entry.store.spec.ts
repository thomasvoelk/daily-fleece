import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { EntryStore } from './entry.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResponse } from '../api';

mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), EntryStore];

function makeSession(sessionId: string): SessionResponse {
  return {
    sessionId,
    date: '2026-05-31',
    hostId: 'host-1',
    phase: 'Lobby',
    projectId: 'default',
    players: [],
    voting: { q1: { status: 'Open' }, q2: { status: 'Open' } },
  };
}

const drainMicrotasks = () => new Promise<void>((r) => queueMicrotask(r));

// ─── createLobby ─────────────────────────────────────────────────────────────

describe('EntryStore – createLobby', () => {
  it('calls registerPlayer with companyId and displayName then navigates to /host', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(EntryStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const promise = store.createLobby('acme', 'Alice');

    const req = http.expectOne('/api/v1/players');
    expect(req.request.body).toMatchObject({ companyId: 'acme', displayName: 'Alice' });
    req.flush({ playerId: 'p1', displayName: 'Alice' });

    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/host']);
  });
});

// ─── joinLobby ───────────────────────────────────────────────────────────────

describe('EntryStore – joinLobby', () => {
  it("calls registerPlayer, joinSession for today's session, then navigates to /lobby", async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(EntryStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const promise = store.joinLobby('acme', 'Alice');

    http.expectOne('/api/v1/players').flush({ playerId: 'p1', displayName: 'Alice' });
    await drainMicrotasks();

    const sessionReq = http.expectOne('/api/v1/sessions/today');
    sessionReq.flush(makeSession('s1'));
    await drainMicrotasks();

    const joinReq = http.expectOne('/api/v1/sessions/s1/join');
    expect(joinReq.request.body).toMatchObject({ playerId: 'p1', displayName: 'Alice' });
    joinReq.flush(makeSession('s1'));

    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/lobby']);
  });
});
