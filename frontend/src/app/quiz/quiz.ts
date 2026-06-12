import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChunkyButton } from '../shared';
import { ApiConfiguration } from '../backend-client';
import { QuizStore } from './quiz.store';
import { QuizPhoto } from './quiz-photo/quiz-photo';
import { QuizHostReveal } from './quiz-host-reveal/quiz-host-reveal';
import { CountryAutocomplete } from './country-autocomplete/country-autocomplete';

@Component({
  selector: 'app-quiz',
  imports: [ChunkyButton, QuizPhoto, QuizHostReveal, CountryAutocomplete],
  templateUrl: './quiz.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quiz {
  protected readonly quizStore = inject(QuizStore);
  private readonly apiConfig = inject(ApiConfiguration);

  protected readonly currentQuestion = computed<'q1' | 'q2'>(() =>
    this.quizStore.q2Status() === 'Open' ? 'q2' : 'q1',
  );

  protected photoUrl(question: 'q1' | 'q2'): string {
    const session = this.quizStore.session();
    return session
      ? `${this.apiConfig.rootUrl}/sessions/${session.projectId}/${session.date}/photos/${question}`
      : '';
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
}
