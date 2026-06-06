import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';

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
  readonly allCountries = input.required<readonly { code: string; name: string }[]>();

  readonly closeQ1Voting = output<'A' | 'B' | 'C'>();
  readonly closeQ2Voting = output<string>();

  protected readonly selectedQ1Answer = signal<'A' | 'B' | 'C' | null>(null);
  protected readonly hostCountryInput = signal('');
  protected readonly selectedCountry = signal<string | null>(null);
  protected readonly filteredCountries = computed(() => {
    const q = this.hostCountryInput().toLowerCase();
    if (!q) return this.allCountries();
    return this.allCountries().filter((c) => c.name.toLowerCase().includes(q));
  });

  protected countryName(code: string): string {
    return this.allCountries().find((c) => c.code === code)?.name ?? code;
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
