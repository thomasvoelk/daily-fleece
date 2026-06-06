import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Api, getLeaderboard, LeaderboardResponse } from '../backend-client';
import { EntryContext } from '../entry/entry-context';

const AVATAR_TONES = [
  { background: 'var(--color-marigold-200)', color: 'var(--color-marigold-700)' },
  { background: 'var(--color-grape-200)', color: 'var(--color-grape-700)' },
  { background: 'var(--color-teal-200)', color: 'var(--color-teal-700)' },
  { background: 'var(--color-coral-200)', color: 'var(--color-coral-700)' },
];

@Component({
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Leaderboard implements OnInit {
  private readonly api = inject(Api);
  protected readonly entry = inject(EntryContext);

  protected readonly data = signal<LeaderboardResponse | null>(null);

  protected readonly myRank = computed(() => {
    const leaderboard = this.data();
    if (!leaderboard) return null;
    const idx = leaderboard.entries.findIndex((e) => e.playerId === this.entry.playerId());
    return idx === -1 ? null : idx + 1;
  });

  protected avatarStyle(index: number): { background: string; color: string } {
    return AVATAR_TONES[index % AVATAR_TONES.length];
  }

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const response = await this.api.invoke(getLeaderboard);
    this.data.set(response);
  }
}
