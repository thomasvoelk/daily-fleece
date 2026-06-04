import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Api, getTodaySession, startSession, SessionResponse } from '../backend-client';
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
        patchState(store, { error: null });
        const session = await api.invoke(getTodaySession);
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
        await api.invoke(startSession, {
          sessionId: session.sessionId,
          body: { hostId: playerId },
        });
        await router.navigate(['/quiz']);
      },
    };
  }),
);
