import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { EntryStore } from './entry.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), EntryStore];

const drainMicrotasks = () =>
  new Promise<void>((r) => {
    queueMicrotask(r);
  });

// ─── createLobby ─────────────────────────────────────────────────────────────

describe('EntryStore – createLobby', () => {
  it('calls registerPlayer with companyId and displayName then navigates to /session/default/<today>/host', async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(EntryStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    const today = '2026-06-12';

    const promise = store.createLobby('acme', 'Alice');

    const req = http.expectOne('/api/v1/players');
    expect(req.request.body).toMatchObject({ companyId: 'acme', displayName: 'Alice' });
    req.flush({ playerId: 'p1', displayName: 'Alice' });

    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/session', 'default', today, 'host']);
  });
});

// ─── joinLobby ───────────────────────────────────────────────────────────────

describe('EntryStore – joinLobby', () => {
  it("calls registerPlayer then joinSessionByKey for today's date, then navigates to /session/default/<today>/lobby", async () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(EntryStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    const today = '2026-06-12';

    const promise = store.joinLobby('acme', 'Alice');

    http.expectOne('/api/v1/players').flush({ playerId: 'p1', displayName: 'Alice' });
    await drainMicrotasks();

    const joinReq = http.expectOne(`/api/v1/sessions/default/${today}/join`);
    expect(joinReq.request.body).toMatchObject({ playerId: 'p1', displayName: 'Alice' });
    joinReq.flush({});

    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/session', 'default', today, 'lobby']);
  });
});
