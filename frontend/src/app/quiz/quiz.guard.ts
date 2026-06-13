import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EntryContext } from '../entry';
import { Api, getSessionByKey, SessionResponse } from '../backend-client';
import { sessionAccessPolicy, RouteType } from '../session';
import { QuizStore } from './quiz.store';

async function resolveSession(
  route: ActivatedRouteSnapshot,
  api: Api,
): Promise<SessionResponse | null> {
  const fromData = route.data['session'] as SessionResponse | null;
  if (fromData) return fromData;
  const projectId = route.parent?.paramMap.get('projectId');
  const date = route.parent?.paramMap.get('date');
  if (!projectId || !date) return null;
  try {
    return await firstValueFrom(api.invoke(getSessionByKey, { projectId, date }));
  } catch {
    return null;
  }
}

export const quizGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const api = inject(Api);
  const entryContext = inject(EntryContext);
  const quizStore = inject(QuizStore);

  const session = await resolveSession(route, api);

  if (!session) return router.createUrlTree(['/']);

  const hasIdentity = !!entryContext.playerId();
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

  quizStore.initializeSession(session, routeType === 'q2' ? 'q2' : 'q1');
  return true;
};
