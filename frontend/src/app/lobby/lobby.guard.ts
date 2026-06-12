import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { EntryContext } from '../entry';
import { SessionResponse } from '../backend-client';
import { LobbyStore } from './lobby.store';

export const lobbyGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const redirect = () => router.createUrlTree(['/']);

  if (!inject(EntryContext).playerId()) return redirect();

  const session = route.data['session'] as SessionResponse | null;
  if (!session) return redirect();

  inject(LobbyStore).initializeSession(session);
  return true;
};
