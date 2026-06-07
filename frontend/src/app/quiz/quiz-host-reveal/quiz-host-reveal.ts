import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ChunkyButton } from '../../shared';
import { CountryAutocomplete } from '../country-autocomplete/country-autocomplete';

@Component({
  selector: 'app-quiz-host-reveal',
  imports: [ChunkyButton, CountryAutocomplete],
  templateUrl: './quiz-host-reveal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizHostReveal {
  readonly q1Status = input.required<'Open' | 'Closed' | null>();
  readonly q2Status = input.required<'Open' | 'Closed' | null>();

  readonly closeQ1Voting = output<'A' | 'B' | 'C'>();
  readonly closeQ2Voting = output<string>();

  protected readonly selectedQ1Answer = signal<'A' | 'B' | 'C' | null>(null);
  protected readonly selectedCountry = signal<string | null>(null);

  protected onCloseQ1(): void {
    const answer = this.selectedQ1Answer();
    if (answer) this.closeQ1Voting.emit(answer);
  }

  protected onCloseQ2(): void {
    const country = this.selectedCountry();
    if (country) this.closeQ2Voting.emit(country);
  }
}
