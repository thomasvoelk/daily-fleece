import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const hasPlayerIdGuard: CanActivateFn = () => {
  const router = inject(Router);
  const redirect = () => router.createUrlTree(['/']);
  try {
    const raw = localStorage.getItem('lobby-player');
    if (!raw) return redirect();
    const { playerId } = JSON.parse(raw) as { playerId: string | null };
    return playerId ? true : redirect();
  } catch {
    return redirect();
  }
};
