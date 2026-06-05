import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Api, getLeaderboard, LeaderboardResponse } from '../backend-client';
import { EntryContext } from '../entry/entry-context';

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

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const response = await this.api.invoke(getLeaderboard);
    this.data.set(response);
  }
}
