import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Api, createSession } from '../backend-client';
import { EntryContext } from '../entry';

interface HostSetupState {
  q1: File | null;
  q2: File | null;
  phase: 'idle' | 'loading' | 'error';
  errorMessage: string | null;
}

export const HostSetupStore = signalStore(
  { providedIn: 'root' },
  withState<HostSetupState>({
    q1: null,
    q2: null,
    phase: 'idle',
    errorMessage: null,
  }),
  withComputed((store) => ({
    canSubmit: computed(
      () => store.q1() !== null && store.q2() !== null && store.phase() !== 'loading',
    ),
  })),
  withMethods((store) => {
    const api = inject(Api);
    const router = inject(Router);
    const entryStore = inject(EntryContext);
    return {
      selectQ1(file: File): void {
        patchState(store, { q1: file });
      },
      selectQ2(file: File): void {
        patchState(store, { q2: file });
      },
      async createSession(): Promise<void> {
        if (!store.canSubmit()) return;
        const playerId = entryStore.playerId();
        const displayName = entryStore.displayName();
        if (!playerId || !displayName) {
          patchState(store, {
            phase: 'error',
            errorMessage: $localize`:hostSetup|Error shown when player identity is missing@@hostSetup.missingIdentity:Player identity not found. Please start over.`,
          });
          return;
        }
        const q1 = store.q1();
        const q2 = store.q2();
        if (!q1 || !q2) return; // canSubmit() already guarantees this; needed for type narrowing
        patchState(store, { phase: 'loading', errorMessage: null });
        try {
          await firstValueFrom(
            api.invoke(createSession, {
              body: {
                hostId: playerId,
                hostDisplayName: displayName,
                q1,
                q2,
              },
            }),
          );
          patchState(store, { phase: 'idle' });
          await router.navigate(['/lobby']);
        } catch {
          patchState(store, {
            phase: 'error',
            errorMessage: $localize`:hostSetup|Error shown when session creation fails@@hostSetup.createError:Something went wrong. Please try again.`,
          });
        }
      },
    };
  }),
);
