import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption,
} from '@angular/material/autocomplete';
import { CountryList } from '../country-list';

@Component({
  selector: 'app-country-autocomplete',
  imports: [MatFormField, MatLabel, MatInput, MatAutocomplete, MatAutocompleteTrigger, MatOption],
  templateUrl: './country-autocomplete.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryAutocomplete {
  readonly countrySelected = output<string>();

  private readonly countryList = inject(CountryList);

  protected readonly query = signal('');
  private readonly selectedCode = signal<string | null>(null);

  protected readonly inputValue = computed(() => {
    const code = this.selectedCode();
    return code ? this.countryList.nameOf(code) : this.query();
  });

  protected readonly filteredCountries = computed(() => this.countryList.filter(this.query()));

  protected onInput(value: string): void {
    this.selectedCode.set(null);
    this.query.set(value);
  }

  protected onSelect(event: MatAutocompleteSelectedEvent): void {
    this.selectedCode.set(event.option.value as string);
    this.query.set('');
    this.countrySelected.emit(event.option.value as string);
  }
}
