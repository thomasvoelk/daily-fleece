import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Api, getTodaySession, getSessionResults, SessionResultsResponse } from '../backend-client';
import { EntryContext } from '../entry';

interface ResultsState {
  data: SessionResultsResponse | null;
}

export const ResultsStore = signalStore(
  { providedIn: 'root' },
  withState<ResultsState>({ data: null }),
  withComputed((store) => {
    const entry = inject(EntryContext);
    return {
      myResult: computed(() => {
        const d = store.data();
        if (!d) return null;
        return d.results.find((r) => r.playerId === entry.playerId()) ?? null;
      }),
      sortedResults: computed(() => {
        const d = store.data();
        if (!d) return [];
        return [...d.results].sort((a, b) => b.totalPoints - a.totalPoints);
      }),
    };
  }),
  withComputed((store) => ({
    correctCount: computed(() => {
      const r = store.myResult();
      if (!r) return 0;
      return (r.q1Correct ? 1 : 0) + (r.q2Correct ? 1 : 0);
    }),
    myRank: computed(() => {
      const d = store.data();
      const me = store.myResult();
      if (!d || !me) return null;
      const sorted = [...d.results].sort((a, b) => b.totalPoints - a.totalPoints);
      return sorted.findIndex((r) => r.playerId === me.playerId) + 1;
    }),
  })),
  withMethods((store) => {
    const api = inject(Api);
    return {
      async load(): Promise<void> {
        const session = await api.invoke(getTodaySession);
        const data = await api.invoke(getSessionResults, { sessionId: session.sessionId });
        patchState(store, { data });
      },
    };
  }),
);
