import { sessionAccessPolicy } from './session-access-policy';
import { SessionResponse } from '../backend-client';

function makeSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    sessionId: 's1',
    projectId: 'default',
    date: '2026-06-01',
    phase: 'Active',
    hostId: 'host-1',
    players: [],
    voting: { q1: { status: 'Open' }, q2: { status: 'Open' } },
    ...overrides,
  };
}

describe('sessionAccessPolicy', () => {
  describe('null session', () => {
    it('redirects to / regardless of identity or route', () => {
      expect(sessionAccessPolicy(null, false, 'lobby')).toEqual({ redirect: '/' });
      expect(sessionAccessPolicy(null, true, 'q1')).toEqual({ redirect: '/' });
      expect(sessionAccessPolicy(null, false, 'results')).toEqual({ redirect: '/' });
    });
  });

  describe('Lobby phase', () => {
    it('allows lobby and host when identity is present', () => {
      const session = makeSession({ phase: 'Lobby' });
      expect(sessionAccessPolicy(session, true, 'lobby')).toBe('allow');
      expect(sessionAccessPolicy(session, true, 'host')).toBe('allow');
    });

    it('redirects q1, q2, results to the session lobby URL when identity is present', () => {
      const session = makeSession({ phase: 'Lobby', projectId: 'default', date: '2026-06-01' });
      const lobbyUrl = '/session/default/2026-06-01/lobby';
      expect(sessionAccessPolicy(session, true, 'q1')).toEqual({ redirect: lobbyUrl });
      expect(sessionAccessPolicy(session, true, 'q2')).toEqual({ redirect: lobbyUrl });
      expect(sessionAccessPolicy(session, true, 'results')).toEqual({ redirect: lobbyUrl });
    });

    it('redirects all routes to / when identity is absent', () => {
      const session = makeSession({ phase: 'Lobby' });
      expect(sessionAccessPolicy(session, false, 'lobby')).toEqual({ redirect: '/' });
      expect(sessionAccessPolicy(session, false, 'host')).toEqual({ redirect: '/' });
      expect(sessionAccessPolicy(session, false, 'q1')).toEqual({ redirect: '/' });
      expect(sessionAccessPolicy(session, false, 'q2')).toEqual({ redirect: '/' });
      expect(sessionAccessPolicy(session, false, 'results')).toEqual({ redirect: '/' });
    });
  });

  describe('Ended phase', () => {
    it('allows q1, q2, results regardless of identity', () => {
      const session = makeSession({ phase: 'Ended' });
      expect(sessionAccessPolicy(session, true, 'q1')).toBe('allow');
      expect(sessionAccessPolicy(session, true, 'q2')).toBe('allow');
      expect(sessionAccessPolicy(session, true, 'results')).toBe('allow');
      expect(sessionAccessPolicy(session, false, 'q1')).toBe('allow');
      expect(sessionAccessPolicy(session, false, 'q2')).toBe('allow');
      expect(sessionAccessPolicy(session, false, 'results')).toBe('allow');
    });

    it('redirects lobby and host to the session results URL', () => {
      const session = makeSession({ phase: 'Ended', projectId: 'default', date: '2026-06-01' });
      const resultsUrl = '/session/default/2026-06-01/results';
      expect(sessionAccessPolicy(session, true, 'lobby')).toEqual({ redirect: resultsUrl });
      expect(sessionAccessPolicy(session, true, 'host')).toEqual({ redirect: resultsUrl });
      expect(sessionAccessPolicy(session, false, 'lobby')).toEqual({ redirect: resultsUrl });
      expect(sessionAccessPolicy(session, false, 'host')).toEqual({ redirect: resultsUrl });
    });
  });

  describe('Active phase', () => {
    it('allows all route types when identity is present', () => {
      const session = makeSession({ phase: 'Active' });
      expect(sessionAccessPolicy(session, true, 'lobby')).toBe('allow');
      expect(sessionAccessPolicy(session, true, 'host')).toBe('allow');
      expect(sessionAccessPolicy(session, true, 'q1')).toBe('allow');
      expect(sessionAccessPolicy(session, true, 'q2')).toBe('allow');
      expect(sessionAccessPolicy(session, true, 'results')).toBe('allow');
    });

    it('redirects to / when identity is absent', () => {
      const session = makeSession({ phase: 'Active' });
      expect(sessionAccessPolicy(session, false, 'lobby')).toEqual({ redirect: '/' });
      expect(sessionAccessPolicy(session, false, 'q1')).toEqual({ redirect: '/' });
      expect(sessionAccessPolicy(session, false, 'results')).toEqual({ redirect: '/' });
    });
  });
});
