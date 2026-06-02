import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Api } from './api/api';
import { getTodaySession } from './api/fn/sessions/get-today-session';
import { QuizStore } from './quiz.store';

export const quizGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const redirect = () => router.createUrlTree(['/lobby']);

  const api = inject(Api);
  const store = inject(QuizStore);
  try {
    const session = await api.invoke(getTodaySession);
    if (session.phase !== 'Active') return redirect();
    store.initializeSession(session);
    return true;
  } catch {
    return redirect();
  }
};
