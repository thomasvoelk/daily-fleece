import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { CountryList } from '../country-list';

@Component({
  selector: 'app-quiz-host-reveal',
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
  ],
  templateUrl: './quiz-host-reveal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizHostReveal {
  readonly q1Status = input.required<'Open' | 'Closed' | null>();
  readonly q2Status = input.required<'Open' | 'Closed' | null>();

  readonly closeQ1Voting = output<'A' | 'B' | 'C'>();
  readonly closeQ2Voting = output<string>();

  private readonly countryList = inject(CountryList);

  protected readonly selectedQ1Answer = signal<'A' | 'B' | 'C' | null>(null);
  protected readonly hostCountryInput = signal('');
  protected readonly selectedCountry = signal<string | null>(null);
  protected readonly filteredCountries = computed(() =>
    this.countryList.filter(this.hostCountryInput()),
  );

  protected countryName(code: string): string {
    return this.countryList.nameOf(code);
  }

  protected onCloseQ1(): void {
    const answer = this.selectedQ1Answer();
    if (answer) this.closeQ1Voting.emit(answer);
  }

  protected onCloseQ2(): void {
    const country = this.selectedCountry();
    if (country) this.closeQ2Voting.emit(country);
  }
}
