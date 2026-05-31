import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Api } from '../api/api';
import { getTodaySession } from '../api/fn/sessions/get-today-session';
import { LobbyStore } from './lobby.store';

export const lobbyGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const redirect = () => router.createUrlTree(['/']);

  try {
    const raw = localStorage.getItem('lobby-player');
    if (!raw) return redirect();
    const { playerId } = JSON.parse(raw) as { playerId: string | null };
    if (!playerId) return redirect();
  } catch {
    return redirect();
  }

  const api = inject(Api);
  const store = inject(LobbyStore);
  try {
    const session = await api.invoke(getTodaySession);
    store.initializeSession(session);
    return true;
  } catch {
    return redirect();
  }
};
