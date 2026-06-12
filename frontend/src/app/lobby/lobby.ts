import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ChunkyButton, AVATAR_TONES } from '../shared';
import { LobbyStore } from './lobby.store';

@Component({
  selector: 'app-lobby',
  imports: [ChunkyButton],
  templateUrl: './lobby.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lobby {
  protected store = inject(LobbyStore);

  protected avatarStyle(index: number): { background: string; color: string } {
    return AVATAR_TONES[index % AVATAR_TONES.length];
  }
}
