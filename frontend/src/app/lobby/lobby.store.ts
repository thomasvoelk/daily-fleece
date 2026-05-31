import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Api } from '../api/api';
import { getTodaySession } from '../api/fn/sessions/get-today-session';
import { startSession } from '../api/fn/sessions/start-session';
import { EntryStore } from '../entry/entry.store';
import { SessionResponse } from '../api/models';

interface LobbyState {
  session: SessionResponse | null;
  refreshError: string | null;
}

export const LobbyStore = signalStore(
  { providedIn: 'root' },
  withState<LobbyState>({
    session: null,
    refreshError: null,
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
    const entryStore = inject(EntryStore);
    return {
      initializeSession(session: SessionResponse): void {
        patchState(store, { session, refreshError: null });
      },

      async refresh(): Promise<void> {
        patchState(store, { refreshError: null });
        try {
          const session = await api.invoke(getTodaySession);
          patchState(store, { session });
        } catch {
          patchState(store, {
            refreshError: $localize`:lobby|Error shown when session refresh fails@@lobby.refreshError:Refresh failed. Please try again.`,
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
      },
    };
  }),
);
