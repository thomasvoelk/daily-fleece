import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { withStorageSync } from '@angular-architects/ngrx-toolkit';
import { Api, registerPlayer, joinSessionByKey } from '../backend-client';
import { TODAY } from '../shared';

interface EntryState {
  playerId: string | null;
  companyId: string | null;
  displayName: string | null;
  phase: 'idle' | 'loading' | 'error';
  errorMessage: string | null;
}

export const EntryStore = signalStore(
  { providedIn: 'root' },
  withState<EntryState>({
    playerId: null,
    companyId: null,
    displayName: null,
    phase: 'idle',
    errorMessage: null,
  }),
  withStorageSync({
    key: 'lobby-player',
    select: (state: EntryState) => ({
      playerId: state.playerId,
      companyId: state.companyId,
      displayName: state.displayName,
    }),
  }),
  withMethods((store) => {
    const api = inject(Api);
    const router = inject(Router);
    const today = inject(TODAY);
    return {
      async createLobby(companyId: string, displayName: string): Promise<void> {
        patchState(store, { phase: 'loading', errorMessage: null });
        try {
          const player = await firstValueFrom(
            api.invoke(registerPlayer, { body: { companyId, displayName } }),
          );
          patchState(store, { playerId: player.playerId, companyId, displayName, phase: 'idle' });
          await router.navigate(['/host']);
        } catch {
          patchState(store, {
            phase: 'error',
            errorMessage: $localize`:entry|Generic error on create@@entry.createError:Something went wrong. Please try again.`,
          });
        }
      },

      async joinLobby(companyId: string, displayName: string): Promise<void> {
        patchState(store, { phase: 'loading', errorMessage: null });
        try {
          const player = await firstValueFrom(
            api.invoke(registerPlayer, { body: { companyId, displayName } }),
          );
          patchState(store, { playerId: player.playerId, companyId, displayName });

          await firstValueFrom(
            api.invoke(joinSessionByKey, {
              projectId: 'default',
              date: today,
              body: { playerId: player.playerId, displayName },
            }),
          );

          patchState(store, { phase: 'idle' });
          await router.navigate(['/lobby']);
        } catch {
          patchState(store, {
            phase: 'error',
            errorMessage: $localize`:entry|Generic error on join@@entry.joinError:Something went wrong. Please try again.`,
          });
        }
      },
    };
  }),
);
