import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Api, getSessionByKey, startSessionByKey, SessionResponse } from '../backend-client';
import { EntryContext } from '../entry';

interface LobbyState {
  session: SessionResponse | null;
  error: string | null;
}

export const LobbyStore = signalStore(
  { providedIn: 'root' },
  withState<LobbyState>({
    session: null,
    error: null,
  }),
  withComputed((store) => {
    const entryStore = inject(EntryContext);
    return {
      isHost: computed(() => {
        const session = store.session();
        const playerId = entryStore.playerId();
        return session !== null && playerId !== null && session.hostId === playerId;
      }),
    };
  }),
  withMethods((store) => {
    const api = inject(Api);
    const router = inject(Router);
    const entryStore = inject(EntryContext);
    return {
      initializeSession(session: SessionResponse): void {
        patchState(store, { session, error: null });
      },

      async goToQuiz(): Promise<void> {
        const current = store.session();
        if (!current) return;
        patchState(store, { error: null });
        const session = await firstValueFrom(
          api.invoke(getSessionByKey, { projectId: 'default', date: current.date }),
        );
        patchState(store, { session });
        if (session.phase === 'Active') {
          await router.navigate(['/quiz']);
        } else {
          patchState(store, {
            error: $localize`:lobby|Error shown when quiz has not started yet@@lobby.quizNotStarted:Quiz not started yet. Please wait.`,
          });
        }
      },

      async startQuiz(): Promise<void> {
        const session = store.session();
        const playerId = entryStore.playerId();
        if (!session || !playerId) return;
        await firstValueFrom(
          api.invoke(startSessionByKey, {
            projectId: 'default',
            date: session.date,
            body: { hostId: playerId },
          }),
        );
        await router.navigate(['/quiz']);
      },
    };
  }),
);
