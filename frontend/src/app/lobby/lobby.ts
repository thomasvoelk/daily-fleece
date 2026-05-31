import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LobbyStore } from './lobby.store';

@Component({
  selector: 'app-lobby',
  imports: [],
  templateUrl: './lobby.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lobby {
  protected store = inject(LobbyStore);
}
