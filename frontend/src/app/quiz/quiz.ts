import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChunkyButton } from '../shared';
import { ApiConfiguration, QuestionVoting } from '../backend-client';
import { QuizStore } from './quiz.store';
import { QuizAnswerReveal } from './quiz-answer-reveal/quiz-answer-reveal';
import { QuizPhoto } from './quiz-photo/quiz-photo';
import { QuizHostReveal } from './quiz-host-reveal/quiz-host-reveal';
import { CountryList } from './country-list';
import { CountryAutocomplete } from './country-autocomplete/country-autocomplete';

type ClosedQuestionVoting = QuestionVoting & { status: 'Closed'; correctAnswer: string };

@Component({
  selector: 'app-quiz',
  imports: [ChunkyButton, QuizAnswerReveal, QuizPhoto, QuizHostReveal, CountryAutocomplete],
  templateUrl: './quiz.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quiz {
  protected readonly quizStore = inject(QuizStore);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly countryList = inject(CountryList);

  protected readonly currentQuestion = computed<'q1' | 'q2'>(() =>
    this.quizStore.q2Status() === 'Open' ? 'q2' : 'q1',
  );

  protected readonly confetti = Array.from({ length: 22 }, (_, i) => {
    const cols = ['#FFB422', '#14B8A6', '#FF5A5F', '#34C759', '#FFFBF4', '#7C3AF0'];
    return {
      left: ((i * 17 + 5) * 13) % 97,
      top: ((i * 11 + 7) * 7) % 63,
      size: 6 + (i % 6),
      color: cols[i % cols.length],
      rotate: (i * 23 + 10) % 65,
    };
  });

  protected readonly bothRevealed = computed(
    () => this.quizStore.q1Status() === 'Closed' && this.quizStore.q2Status() === 'Closed',
  );

  protected readonly q1Revealed = computed((): ClosedQuestionVoting | null => {
    const q1 = this.quizStore.session()?.voting.q1;
    return q1?.status === 'Closed' && this.quizStore.q2Status() === 'Closed'
      ? (q1 as ClosedQuestionVoting)
      : null;
  });

  protected readonly q2Revealed = computed((): ClosedQuestionVoting | null => {
    const q2 = this.quizStore.session()?.voting.q2;
    return q2?.status === 'Closed' && q2.correctAnswer != null
      ? (q2 as ClosedQuestionVoting)
      : null;
  });

  protected readonly q1AnswerEntries = computed(() =>
    Object.values(this.quizStore.session()?.voting.q1.answers ?? {}),
  );
  protected readonly q2AnswerEntries = computed(() =>
    Object.values(this.quizStore.session()?.voting.q2.answers ?? {}).map((e) => ({
      displayName: e.displayName,
      answer: this.countryName(e.answer),
    })),
  );

  protected photoUrl(question: 'q1' | 'q2'): string {
    const id = this.quizStore.session()?.sessionId;
    return id ? `${this.apiConfig.rootUrl}/sessions/${id}/photos/${question}` : '';
  }

  protected submit(answer: 'A' | 'B' | 'C'): void {
    void this.quizStore.submitQ1Answer(answer);
  }

  protected submitQ2(code: string): void {
    void this.quizStore.submitQ2Answer(code);
  }

  protected refresh(): void {
    void this.quizStore.refresh();
  }

  protected onCloseQ1Voting(answer: 'A' | 'B' | 'C'): void {
    void this.quizStore.setQ1CorrectAnswer(answer);
  }

  protected onCloseQ2Voting(countryCode: string): void {
    void this.quizStore.setQ2CorrectAnswer(countryCode);
  }

  protected countryName(code: string): string {
    return this.countryList.nameOf(code);
  }
}
