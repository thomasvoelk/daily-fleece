import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Api, getSessionByKey } from '../backend-client';
import { QuizStore } from './quiz.store';

export const quizGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const redirect = () => router.createUrlTree(['/lobby']);

  const api = inject(Api);
  const store = inject(QuizStore);
  try {
    const date = new Date().toISOString().slice(0, 10);
    const session = await firstValueFrom(
      api.invoke(getSessionByKey, { projectId: 'default', date }),
    );
    if (session.phase !== 'Active') return redirect();
    store.initializeSession(session);
    return true;
  } catch {
    return redirect();
  }
};
