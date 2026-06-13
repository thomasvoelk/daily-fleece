import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Api, getSessionByKey, SessionResponse } from '../backend-client';

export const sessionResolver: ResolveFn<SessionResponse | UrlTree | null> = async (
  route: ActivatedRouteSnapshot,
) => {
  const api = inject(Api);
  const router = inject(Router);
  const projectId = route.paramMap.get('projectId');
  const date = route.paramMap.get('date');
  if (!projectId || !date) return router.createUrlTree(['/']);
  const isHostRoute = route.firstChild?.routeConfig?.path === 'host';
  try {
    return await firstValueFrom(api.invoke(getSessionByKey, { projectId, date }));
  } catch {
    return isHostRoute ? null : router.createUrlTree(['/']);
  }
};
