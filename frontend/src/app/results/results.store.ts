import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Api, getSessionResultsByKey, SessionResultsResponse } from '../backend-client';
import { EntryContext } from '../entry';
import { TODAY } from '../shared';

export interface EnrichedResult {
  playerId: string;
  displayName: string;
  q1Answer: string | null;
  q2Answer: string | null;
  q1Correct: boolean;
  q2Correct: boolean;
  totalPoints: number;
}

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
      q1CorrectAnswer: computed(() => store.data()?.q1CorrectAnswer ?? null),
      q2CorrectAnswer: computed(() => store.data()?.q2CorrectAnswer ?? null),
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
    enrichedResults: computed((): EnrichedResult[] => {
      return store.sortedResults().map((r) => ({
        playerId: r.playerId,
        displayName: r.displayName,
        q1Answer: r.q1Answer ?? null,
        q2Answer: r.q2Answer ?? null,
        q1Correct: r.q1Correct,
        q2Correct: r.q2Correct,
        totalPoints: r.totalPoints,
      }));
    }),
  })),
  withMethods((store) => {
    const api = inject(Api);
    const today = inject(TODAY);
    return {
      async load(): Promise<void> {
        const data = await firstValueFrom(
          api.invoke(getSessionResultsByKey, { projectId: 'default', date: today }),
        );
        patchState(store, { data });
      },
    };
  }),
);
