import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, submit, required, maxLength } from '@angular/forms/signals';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ChunkyButton } from '../shared';
import { EntryStore } from './entry.store';

@Component({
  selector: 'app-entry',
  imports: [FormField, MatFormField, MatLabel, MatInput, MatError, ChunkyButton],
  templateUrl: './entry.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Entry {
  protected store = inject(EntryStore);

  private readonly model = signal({
    companyId: this.store.companyId() ?? '',
    displayName: this.store.displayName() ?? '',
  });

  protected entryForm = form(this.model, (s) => {
    required(s.companyId, {
      message: $localize`:entry|Validation error when Company ID is empty@@entry.companyIdRequired:Required`,
    });
    required(s.displayName, {
      message: $localize`:entry|Validation error when Display name is empty@@entry.displayNameRequired:Required`,
    });
    maxLength(s.displayName, 20, {
      message: $localize`:entry|Validation error when Display name exceeds 20 characters@@entry.displayNameTooLong:Maximum 20 characters`,
    });
  });

  protected onJoinLobby(): void {
    void submit(this.entryForm, async () => {
      await this.store.joinLobby(this.model().companyId, this.model().displayName);
    });
  }

  protected onCreateLobby(): void {
    void submit(this.entryForm, async () => {
      await this.store.createLobby(this.model().companyId, this.model().displayName);
    });
  }
}
