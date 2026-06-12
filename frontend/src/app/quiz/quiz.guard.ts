import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { EntryContext } from '../entry';
import { SessionResponse } from '../backend-client';
import { sessionAccessPolicy, RouteType } from '../session';
import { QuizStore } from './quiz.store';

export const quizGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const session = route.data['session'] as SessionResponse | null;

  if (!session) return router.createUrlTree(['/']);

  const hasIdentity = !!inject(EntryContext).playerId();
  const urlSegment = route.url[route.url.length - 1]?.path ?? 'q1';
  const routeType: RouteType = urlSegment === 'q2' ? 'q2' : 'q1';

  const access = sessionAccessPolicy(session, hasIdentity, routeType);
  if (access !== 'allow') {
    return router.createUrlTree([access.redirect]);
  }

  if (session.phase === 'Active') {
    const { q1, q2 } = session.voting;
    if (routeType === 'q1' && q1.status === 'Closed' && q2.status === 'Open') {
      return router.createUrlTree([`/session/${session.projectId}/${session.date}/q2`]);
    }
    if (routeType === 'q2' && q2.status === 'Closed' && q1.status === 'Open') {
      return router.createUrlTree([`/session/${session.projectId}/${session.date}/q1`]);
    }
  }

  inject(QuizStore).initializeSession(session);
  return true;
};
