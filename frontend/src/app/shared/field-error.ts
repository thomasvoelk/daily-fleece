import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
  selector: 'app-field-error',
  template: `
    @if (state().touched() && state().invalid()) {
      <span [id]="id()" class="text-sm text-red-600">{{ state().errors()[0].message }}</span>
    }
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldError {
  state = input.required<FieldState<unknown>>();
  id = input.required<string>();
}
