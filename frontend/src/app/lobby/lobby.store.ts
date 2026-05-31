import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { withStorageSync } from '@angular-architects/ngrx-toolkit';
import { Api } from '../api/api';
import { registerPlayer } from '../api/fn/players/register-player';
import { joinSession } from '../api/fn/sessions/join-session';
import { getTodaySession } from '../api/fn/sessions/get-today-session';
import { SessionResponse } from '../api/models';

type LobbyPhase = 'idle' | 'loading' | 'joined' | 'inProgress' | 'error';

interface LobbyState {
  playerId: string | null;
  companyId: string | null;
  displayName: string | null;
  phase: LobbyPhase;
  session: SessionResponse | null;
  errorMessage: string | null;
  refreshError: string | null;
}

export const LobbyStore = signalStore(
  { providedIn: 'root' },
  withState<LobbyState>({
    playerId: null,
    companyId: null,
    displayName: null,
    phase: 'idle',
    session: null,
    errorMessage: null,
    refreshError: null,
  }),
  withStorageSync({
    key: 'lobby-player',
    select: (state: LobbyState) => ({
      playerId: state.playerId,
      companyId: state.companyId,
      displayName: state.displayName,
    }),
  }),
  withMethods((store) => {
    const api = inject(Api);
    return {
      async join(companyId: string, displayName: string): Promise<void> {
        patchState(store, { phase: 'loading', errorMessage: null });
        try {
          const player = await api.invoke(registerPlayer, { body: { companyId, displayName } });
          patchState(store, { playerId: player.playerId, companyId, displayName });

          const session = await api.invoke(getTodaySession);

          const updatedSession = await api.invoke(joinSession, {
            sessionId: session.sessionId,
            body: { playerId: player.playerId, displayName },
          });

          patchState(store, { phase: 'joined', session: updatedSession });
        } catch (err: unknown) {
          if (
            err instanceof HttpErrorResponse &&
            (err.error as { type?: string })?.type === '/problems/session-already-active'
          ) {
            patchState(store, { phase: 'inProgress' });
          } else {
            patchState(store, {
              phase: 'error',
              errorMessage: 'Something went wrong. Please try again.',
            });
          }
        }
      },

      async refresh(): Promise<void> {
        patchState(store, { refreshError: null });
        try {
          const session = await api.invoke(getTodaySession);
          patchState(store, { session });
        } catch {
          patchState(store, {
            refreshError: $localize`:lobby|Error shown when the session refresh fails@@lobby.refreshError:Refresh failed. Please try again.`,
          });
        }
      },
    };
  }),
);
