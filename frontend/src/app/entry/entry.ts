import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, submit, required, maxLength } from '@angular/forms/signals';
import { EntryStore } from './entry.store';
import { FieldError } from '../shared';

@Component({
  selector: 'app-entry',
  imports: [FormField, FieldError],
  templateUrl: './entry.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Entry {
  protected store = inject(EntryStore);

  private model = signal({
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

  protected companyIdInvalid = computed(
    () => this.entryForm.companyId().touched() && this.entryForm.companyId().invalid(),
  );
  protected displayNameInvalid = computed(
    () => this.entryForm.displayName().touched() && this.entryForm.displayName().invalid(),
  );

  protected onJoinLobby(): void {
    submit(this.entryForm, async () => {
      await this.store.joinLobby(this.model().companyId, this.model().displayName);
    });
  }

  protected onCreateLobby(): void {
    submit(this.entryForm, async () => {
      await this.store.createLobby(this.model().companyId, this.model().displayName);
    });
  }
}
