import { ChangeDetectionStrategy, Component, HostListener, input, signal } from '@angular/core';

@Component({
  selector: 'app-quiz-photo',
  imports: [],
  templateUrl: './quiz-photo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizPhoto {
  readonly src = input.required<string>();
  readonly question = input.required<'q1' | 'q2'>();

  protected readonly expanded = signal(false);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.expanded.set(false);
  }
}
