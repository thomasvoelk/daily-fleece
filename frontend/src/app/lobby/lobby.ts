import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { form, FormField, submit, required, maxLength } from '@angular/forms/signals';
import { LobbyStore } from './lobby.store';

@Component({
  selector: 'app-lobby',
  imports: [FormField],
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
    required(s.companyId);
    required(s.displayName);
    maxLength(s.displayName, 20);
  });

  protected companyIdError = computed(() => {
    const f = this.joinForm.companyId();
    return f.touched() && f.invalid() ? 'required' : null;
  });

  protected displayNameError = computed(() => {
    const f = this.joinForm.displayName();
    if (!f.touched() || f.valid()) return null;
    return f.errors().find((e) => e.kind === 'maxLength') ? 'maxLength' : 'required';
  });

  protected onJoin(): void {
    submit(this.joinForm, async () => {
      await this.store.join(this.model().companyId, this.model().displayName);
    });
  }
}
