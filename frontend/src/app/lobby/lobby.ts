import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { form, FormField, submit, required, maxLength } from '@angular/forms/signals';
import { LobbyStore } from './lobby.store';
import { FieldError } from '../shared/field-error';

@Component({
  selector: 'app-lobby',
  imports: [FormField, FieldError],
  templateUrl: './lobby.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: '',
})
export class Lobby {
  protected store = inject(LobbyStore);

  private model = signal({
    companyId: this.store.companyId() ?? '',
    displayName: this.store.displayName() ?? '',
  });

  protected joinForm = form(this.model, (s) => {
    required(s.companyId, {
      message: $localize`:lobby|Validation error when Company ID is empty@@lobby.companyIdRequired:Required`,
    });
    required(s.displayName, {
      message: $localize`:lobby|Validation error when Display name is empty@@lobby.displayNameRequired:Required`,
    });
    maxLength(s.displayName, 20, {
      message: $localize`:lobby|Validation error when Display name exceeds 20 characters@@lobby.displayNameTooLong:Maximum 20 characters`,
    });
  });

  protected onJoin(): void {
    submit(this.joinForm, async () => {
      await this.store.join(this.model().companyId, this.model().displayName);
    });
  }
}
