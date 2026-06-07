import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Api, getTodaySession } from '../backend-client';
import { EntryContext } from '../entry';
import { LobbyStore } from './lobby.store';

export const lobbyGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const redirect = () => router.createUrlTree(['/']);

  if (!inject(EntryContext).playerId()) return redirect();

  const api = inject(Api);
  const store = inject(LobbyStore);
  try {
    const session = await firstValueFrom(api.invoke(getTodaySession));
    store.initializeSession(session);
    return true;
  } catch {
    return redirect();
  }
};
