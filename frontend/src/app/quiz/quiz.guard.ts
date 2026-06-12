import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Api, getSessionByKey } from '../backend-client';
import { TODAY } from '../shared';
import { QuizStore } from './quiz.store';

export const quizGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const redirect = () => router.createUrlTree(['/lobby']);

  const api = inject(Api);
  const store = inject(QuizStore);
  const today = inject(TODAY);
  try {
    const session = await firstValueFrom(
      api.invoke(getSessionByKey, { projectId: 'default', date: today }),
    );
    if (session.phase !== 'Active') return redirect();
    store.initializeSession(session);
    return true;
  } catch {
    return redirect();
  }
};
