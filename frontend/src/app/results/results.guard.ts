import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { EntryContext } from '../entry';
import { SessionResponse } from '../backend-client';
import { sessionAccessPolicy } from '../session';
import { ResultsStore } from './results.store';

export const resultsGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const session = route.data['session'] as SessionResponse | null;

  if (!session) return router.createUrlTree(['/']);

  const hasIdentity = !!inject(EntryContext).playerId();
  const access = sessionAccessPolicy(session, hasIdentity, 'results');
  if (access !== 'allow') {
    return router.createUrlTree([access.redirect]);
  }

  inject(ResultsStore).initializeSession(session);
  return true;
};
