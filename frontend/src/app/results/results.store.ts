import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import {
  Api,
  getTodaySession,
  getSessionResults,
  SessionResponse,
  SessionResultsResponse,
} from '../backend-client';
import { EntryContext } from '../entry';

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
  session: SessionResponse | null;
  data: SessionResultsResponse | null;
}

export const ResultsStore = signalStore(
  { providedIn: 'root' },
  withState<ResultsState>({ session: null, data: null }),
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
      q1CorrectAnswer: computed(() => store.session()?.voting.q1.correctAnswer ?? null),
      q2CorrectAnswer: computed(() => store.session()?.voting.q2.correctAnswer ?? null),
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
      const session = store.session();
      const sorted = store.sortedResults();
      return sorted.map((r) => ({
        playerId: r.playerId,
        displayName: r.displayName,
        q1Answer: session?.voting.q1.answers?.[r.playerId]?.answer ?? null,
        q2Answer: session?.voting.q2.answers?.[r.playerId]?.answer ?? null,
        q1Correct: r.q1Correct,
        q2Correct: r.q2Correct,
        totalPoints: r.totalPoints,
      }));
    }),
  })),
  withMethods((store) => {
    const api = inject(Api);
    return {
      async load(): Promise<void> {
        const session = await firstValueFrom(api.invoke(getTodaySession));
        const data = await firstValueFrom(
          api.invoke(getSessionResults, { sessionId: session.sessionId }),
        );
        patchState(store, { session, data });
      },
    };
  }),
);
