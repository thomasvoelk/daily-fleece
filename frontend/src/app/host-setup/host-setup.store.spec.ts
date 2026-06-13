import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { HostSetupStore } from './host-setup.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { SessionResponse } from '../backend-client';
mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), HostSetupStore];

function seedPlayer(playerId: string, displayName: string): void {
  localStorage.setItem(
    'lobby-player',
    JSON.stringify({ playerId, companyId: 'acme', displayName }),
  );
}

function makeSession(): SessionResponse {
  return {
    sessionId: 's1',
    date: '2026-05-31',
    hostId: 'host-1',
    phase: 'Lobby',
    projectId: 'default',
    players: [],
    voting: { q1: { status: 'Open' }, q2: { status: 'Open' } },
  };
}

const TODAY = '2026-06-12';
const CREATE_URL = `/api/v1/sessions/default/${TODAY}`;

// ─── initialize ──────────────────────────────────────────────────────────────

describe('HostSetupStore – initialize', () => {
  it('stores the projectId and date from the route params', () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(HostSetupStore);
    store.initialize('default', '2026-06-12');
    expect(store.projectId()).toBe('default');
    expect(store.date()).toBe('2026-06-12');
  });
});

// ─── createSession ───────────────────────────────────────────────────────────

describe('HostSetupStore – createSession', () => {
  it('posts FormData with hostId, hostDisplayName, q1, q2 to POST /sessions/default/{date}', async () => {
    seedPlayer('p1', 'Alice');
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(HostSetupStore);
    const http = TestBed.inject(HttpTestingController);

    store.initialize('default', TODAY);
    const q1File = new File(['img1'], 'q1.jpg', { type: 'image/jpeg' });
    const q2File = new File(['img2'], 'q2.jpg', { type: 'image/jpeg' });
    store.selectQ1(q1File);
    store.selectQ2(q2File);

    const promise = store.createSession();

    const req = http.expectOne(CREATE_URL);
    expect(req.request.method).toBe('POST');
    const fd = req.request.body as FormData;
    expect(fd.get('hostId')).toBe('p1');
    expect(fd.get('hostDisplayName')).toBe('Alice');
    expect(fd.get('q1')).toBe(q1File);
    expect(fd.get('q2')).toBe(q2File);
    req.flush(makeSession());
    await promise;
  });

  it('navigates to /session/default/{date}/lobby on success', async () => {
    seedPlayer('p1', 'Alice');
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(HostSetupStore);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    store.initialize('default', TODAY);
    store.selectQ1(new File(['x'], 'q1.jpg', { type: 'image/jpeg' }));
    store.selectQ2(new File(['x'], 'q2.jpg', { type: 'image/jpeg' }));

    const promise = store.createSession();
    http.expectOne(CREATE_URL).flush(makeSession());
    await promise;

    expect(navigateSpy).toHaveBeenCalledWith(['/session', 'default', TODAY, 'lobby']);
  });

  it('sets phase to error when player identity is not set', async () => {
    // No seedPlayer call — playerId and displayName remain null
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(HostSetupStore);
    const http = TestBed.inject(HttpTestingController);

    store.initialize('default', TODAY);
    store.selectQ1(new File(['x'], 'q1.jpg', { type: 'image/jpeg' }));
    store.selectQ2(new File(['x'], 'q2.jpg', { type: 'image/jpeg' }));

    await store.createSession();

    http.expectNone(CREATE_URL);
    expect(store.phase()).toBe('error');
    expect(store.errorMessage()).toBeTruthy();
  });

  it('sets phase to error and re-enables canSubmit on failure', async () => {
    seedPlayer('p1', 'Alice');
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(HostSetupStore);
    const http = TestBed.inject(HttpTestingController);

    store.initialize('default', TODAY);
    store.selectQ1(new File(['x'], 'q1.jpg', { type: 'image/jpeg' }));
    store.selectQ2(new File(['x'], 'q2.jpg', { type: 'image/jpeg' }));

    const promise = store.createSession();
    http
      .expectOne(CREATE_URL)
      .flush({ message: 'Server Error' }, { status: 500, statusText: 'Server Error' });
    await promise;

    expect(store.phase()).toBe('error');
    expect(store.errorMessage()).toBe('Etwas ist schiefgelaufen. Bitte erneut versuchen.');
    expect(store.canSubmit()).toBe(true);
  });
});

// ─── canSubmit ───────────────────────────────────────────────────────────────

describe('HostSetupStore – canSubmit', () => {
  it('is false when no files are selected', () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(HostSetupStore);
    expect(store.canSubmit()).toBe(false);
  });

  it('is false when only q1 is selected', () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(HostSetupStore);
    store.selectQ1(new File(['x'], 'q1.jpg', { type: 'image/jpeg' }));
    expect(store.canSubmit()).toBe(false);
  });

  it('becomes true after both q1 and q2 are selected', () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const store = TestBed.inject(HostSetupStore);
    store.selectQ1(new File(['x'], 'q1.jpg', { type: 'image/jpeg' }));
    store.selectQ2(new File(['x'], 'q2.jpg', { type: 'image/jpeg' }));
    expect(store.canSubmit()).toBe(true);
  });
});
