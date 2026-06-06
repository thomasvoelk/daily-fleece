import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { ApiConfiguration } from '../backend-client';
import { QuizStore } from './quiz.store';
import { QuizAnswerReveal } from './quiz-answer-reveal/quiz-answer-reveal';
import { QuizPhoto } from './quiz-photo/quiz-photo';
import { QuizHostReveal } from './quiz-host-reveal/quiz-host-reveal';
import { CountryList } from './country-list';

@Component({
  selector: 'app-quiz',
  imports: [
    MatRadioGroup,
    MatRadioButton,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    QuizAnswerReveal,
    QuizPhoto,
    QuizHostReveal,
  ],
  templateUrl: './quiz.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quiz {
  protected readonly quizStore = inject(QuizStore);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly countryList = inject(CountryList);

  protected readonly q2CountryInput = signal('');
  protected readonly filteredCountries = computed(() =>
    this.countryList.filter(this.q2CountryInput()),
  );
  protected readonly currentQuestion = computed<'q1' | 'q2'>(() =>
    this.quizStore.q2Status() === 'Open' ? 'q2' : 'q1',
  );

  protected readonly bothRevealed = computed(() => {
    const session = this.quizStore.session();
    return (
      this.quizStore.q1Status() === 'Closed' &&
      !!session?.voting.q1.correctAnswer &&
      this.quizStore.q2Status() === 'Closed' &&
      !!session.voting.q2.correctAnswer
    );
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
