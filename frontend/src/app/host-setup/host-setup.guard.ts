import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { EntryContext } from '../entry';
import { HostSetupStore } from './host-setup.store';

export const hasPlayerIdGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const redirect = () => router.createUrlTree(['/']);

  if (!inject(EntryContext).playerId()) return redirect();

  const projectId = route.parent?.paramMap.get('projectId') ?? 'default';
  const date = route.parent?.paramMap.get('date') ?? '';
  inject(HostSetupStore).initialize(projectId, date);
  return true;
};
