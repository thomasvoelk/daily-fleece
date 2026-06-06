import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';

export interface AnswerEntry {
  displayName: string;
  answer: string;
}

@Component({
  selector: 'app-quiz-answer-reveal',
  imports: [MatCard, MatCardContent],
  templateUrl: './quiz-answer-reveal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizAnswerReveal {
  readonly correctAnswer = input.required<string>();
  readonly entries = input.required<AnswerEntry[]>();
}
