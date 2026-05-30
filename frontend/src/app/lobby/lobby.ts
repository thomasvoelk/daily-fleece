import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
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

  protected onJoin(): void {
    submit(this.joinForm, async () => {
      await this.store.join(this.model().companyId, this.model().displayName);
    });
  }
}
