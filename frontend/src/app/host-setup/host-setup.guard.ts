import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { EntryContext } from '../entry';

export const hasPlayerIdGuard: CanActivateFn = () => {
  const router = inject(Router);
  const redirect = () => router.createUrlTree(['/']);
  return inject(EntryContext).playerId() ? true : redirect();
};
