import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LobbyStore } from './lobby.store';

const AVATAR_TONES = [
  { background: 'var(--color-marigold-200)', color: 'var(--color-marigold-700)' },
  { background: 'var(--color-grape-200)', color: 'var(--color-grape-700)' },
  { background: 'var(--color-teal-200)', color: 'var(--color-teal-700)' },
  { background: 'var(--color-coral-200)', color: 'var(--color-coral-700)' },
];

@Component({
  selector: 'app-lobby',
  imports: [],
  templateUrl: './lobby.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lobby {
  protected store = inject(LobbyStore);

  protected avatarStyle(index: number): { background: string; color: string } {
    return AVATAR_TONES[index % AVATAR_TONES.length];
  }
}
