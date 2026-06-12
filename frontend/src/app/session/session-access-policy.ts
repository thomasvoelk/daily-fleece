import { SessionResponse } from '../backend-client';

export type RouteType = 'lobby' | 'host' | 'q1' | 'q2' | 'results';
export type AccessResult = 'allow' | { redirect: string };

export function sessionAccessPolicy(
  session: SessionResponse | null,
  hasIdentity: boolean,
  routeType: RouteType,
): AccessResult {
  if (!session) return { redirect: '/' };
  if (session.phase === 'Active') {
    return hasIdentity ? 'allow' : { redirect: '/' };
  }
  if (session.phase === 'Ended') {
    if (routeType === 'lobby' || routeType === 'host') {
      return { redirect: `/session/${session.projectId}/${session.date}/results` };
    }
    return 'allow';
  }
  // Lobby phase
  if (!hasIdentity) return { redirect: '/' };
  if (routeType === 'lobby' || routeType === 'host') return 'allow';
  return { redirect: `/session/${session.projectId}/${session.date}/lobby` };
}
