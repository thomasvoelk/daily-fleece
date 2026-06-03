import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Api } from '../api/api';
import { getTodaySession } from '../api/fn/sessions/get-today-session';
import { startSession } from '../api/fn/sessions/start-session';
import { EntryStore } from '../entry';
import { SessionResponse } from '../api/models';

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
    const entryStore = inject(EntryStore);
    return {
      isHost: computed(
        () =>
          store.session() !== null &&
          entryStore.playerId() !== null &&
          store.session()!.hostId === entryStore.playerId(),
      ),
    };
  }),
  withMethods((store) => {
    const api = inject(Api);
    const router = inject(Router);
    const entryStore = inject(EntryStore);
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
