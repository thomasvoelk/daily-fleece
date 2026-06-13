import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EntryContext } from '../entry';
import { Api, getSessionByKey, SessionResponse } from '../backend-client';
import { sessionAccessPolicy } from '../session';
import { ResultsStore } from './results.store';

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

export const resultsGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const api = inject(Api);
  const entryContext = inject(EntryContext);
  const resultsStore = inject(ResultsStore);

  const session = await resolveSession(route, api);

  if (!session) return router.createUrlTree(['/']);

  const hasIdentity = !!entryContext.playerId();
  const access = sessionAccessPolicy(session, hasIdentity, 'results');
  if (access !== 'allow') {
    return router.createUrlTree([access.redirect]);
  }

  resultsStore.initializeSession(session);
  return true;
};
