import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Api, getSessionByKey } from '../backend-client';
import { EntryContext } from '../entry';
import { LobbyStore } from './lobby.store';

export const lobbyGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const redirect = () => router.createUrlTree(['/']);

  if (!inject(EntryContext).playerId()) return redirect();

  const api = inject(Api);
  const store = inject(LobbyStore);
  try {
    const date = new Date().toISOString().slice(0, 10);
    const session = await firstValueFrom(
      api.invoke(getSessionByKey, { projectId: 'default', date }),
    );
    store.initializeSession(session);
    return true;
  } catch {
    return redirect();
  }
};
