import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizStore } from './quiz.store';

@Component({
  selector: 'app-quiz',
  imports: [CommonModule],
  templateUrl: './quiz.html',
  styleUrl: './quiz.css',
})
export class Quiz {
  protected readonly quizStore = inject(QuizStore);

  protected readonly selectedCorrectAnswer = signal<'A' | 'B' | 'C' | null>(null);

  protected submit(answer: 'A' | 'B' | 'C'): void {
    this.quizStore.submitQ1Answer(answer);
  }

  protected refresh(): void {
    this.quizStore.refresh();
  }

  protected closeVoting(): void {
    const answer = this.selectedCorrectAnswer();
    if (answer) this.quizStore.setQ1CorrectAnswer(answer);
  }
}
