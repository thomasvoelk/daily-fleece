import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatList, MatListItem } from '@angular/material/list';
import { MatButton } from '@angular/material/button';
import { LobbyStore } from './lobby.store';

@Component({
  selector: 'app-lobby',
  imports: [MatList, MatListItem, MatButton],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lobby {
  protected store = inject(LobbyStore);
}
