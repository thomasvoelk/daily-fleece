import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import {
  Api,
  getTodaySession,
  submitAnswer,
  setCorrectAnswer,
  SessionResponse,
} from '../backend-client';
import { EntryContext } from '../entry';

interface QuizState {
  session: SessionResponse | null;
  error: string | null;
  ownQ1Answer: 'A' | 'B' | 'C' | null;
  ownQ2Answer: string | null;
}

export const QuizStore = signalStore(
  { providedIn: 'root' },
  withState<QuizState>({
    session: null,
    error: null,
    ownQ1Answer: null,
    ownQ2Answer: null,
  }),
  withComputed((store) => {
    const entryStore = inject(EntryContext);
    return {
      q1Status: computed(() => store.session()?.voting.q1.status ?? null),
      q2Status: computed(() => store.session()?.voting.q2.status ?? null),
      isHost: computed(() => {
        const session = store.session();
        const playerId = entryStore.playerId();
        return session !== null && playerId !== null && session.hostId === playerId;
      }),
      myQ1Answer: computed(() => {
        const ownAnswer = store.ownQ1Answer();
        if (ownAnswer) return ownAnswer;
        const playerId = entryStore.playerId();
        if (!playerId) return null;
        return store.session()?.voting.q1.answers?.[playerId]?.answer ?? null;
      }),
      myQ2Answer: computed(() => {
        const ownAnswer = store.ownQ2Answer();
        if (ownAnswer) return ownAnswer;
        const playerId = entryStore.playerId();
        if (!playerId) return null;
        return store.session()?.voting.q2.answers?.[playerId]?.answer ?? null;
      }),
      answerCount: computed(() => {
        const session = store.session();
        if (!session) return { answered: 0, total: 0 };
        const answered = session.voting.q1.answerCount ?? 0;
        const total = session.players.length;
        return { answered, total };
      }),
      q2AnswerCount: computed(() => {
        const session = store.session();
        if (!session) return { answered: 0, total: 0 };
        const answered = session.voting.q2.answerCount ?? 0;
        const total = session.players.length;
        return { answered, total };
      }),
    };
  }),
  withMethods((store) => {
    const api = inject(Api);
    const router = inject(Router);
    const entryStore = inject(EntryContext);

    async function fetchAndStore(): Promise<void> {
      const session = await api.invoke(getTodaySession);
      patchState(store, { session, error: null });
    }

    return {
      initializeSession(session: SessionResponse): void {
        patchState(store, { session, error: null });
      },

      async loadSession(): Promise<void> {
        const session = await api.invoke(getTodaySession);
        patchState(store, { session, error: null });
        if (session.phase === 'Ended') {
          await router.navigate(['/results']);
        } else if (session.phase !== 'Active') {
          await router.navigate(['/lobby']);
        }
      },

      async refresh(): Promise<void> {
        const session = await api.invoke(getTodaySession);
        patchState(store, { session, error: null });
        if (session.phase === 'Ended') {
          await router.navigate(['/results']);
        }
      },

      async submitQ1Answer(answer: 'A' | 'B' | 'C'): Promise<void> {
        const session = store.session();
        const playerId = entryStore.playerId();
        if (!session || !playerId) return;
        patchState(store, { ownQ1Answer: answer });
        await api.invoke(submitAnswer, {
          sessionId: session.sessionId,
          question: 'q1',
          body: { playerId, answer },
        });
        await fetchAndStore();
      },

      async submitQ2Answer(answer: string): Promise<void> {
        const session = store.session();
        const playerId = entryStore.playerId();
        if (!session || !playerId) return;
        patchState(store, { ownQ2Answer: answer });
        await api.invoke(submitAnswer, {
          sessionId: session.sessionId,
          question: 'q2',
          body: { playerId, answer },
        });
        await fetchAndStore();
      },

      async setQ1CorrectAnswer(correctAnswer: 'A' | 'B' | 'C'): Promise<void> {
        const session = store.session();
        const playerId = entryStore.playerId();
        if (!session || !playerId) return;
        const updated = await api.invoke(setCorrectAnswer, {
          sessionId: session.sessionId,
          question: 'q1',
          body: { hostId: playerId, correctAnswer },
        });
        patchState(store, { session: updated, error: null });
      },

      async setQ2CorrectAnswer(correctAnswer: string): Promise<void> {
        const session = store.session();
        const playerId = entryStore.playerId();
        if (!session || !playerId) return;
        const updated = await api.invoke(setCorrectAnswer, {
          sessionId: session.sessionId,
          question: 'q2',
          body: { hostId: playerId, correctAnswer },
        });
        patchState(store, { session: updated, error: null });
      },
    };
  }),
);
