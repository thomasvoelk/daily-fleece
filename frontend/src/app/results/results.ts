import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Api, getTodaySession, getSessionResults, SessionResultsResponse } from '../backend-client';
import { EntryContext } from '../entry';

@Component({
  selector: 'app-results',
  imports: [],
  templateUrl: './results.html',
  styleUrl: './results.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  protected readonly entry = inject(EntryContext);

  protected readonly results = signal<SessionResultsResponse | null>(null);

  protected readonly confetti = Array.from({ length: 22 }, (_, i) => {
    const cols = ['#FFB422', '#14B8A6', '#FF5A5F', '#34C759', '#FFFBF4', '#7C3AF0'];
    return {
      left: ((i * 17 + 5) * 13) % 97,
      top: ((i * 11 + 7) * 7) % 63,
      size: 6 + (i % 6),
      color: cols[i % cols.length],
      rotate: (i * 23 + 10) % 65,
    };
  });

  protected readonly myResult = computed(() => {
    const data = this.results();
    if (!data) return null;
    return data.results.find((r) => r.playerId === this.entry.playerId()) ?? null;
  });

  protected readonly correctCount = computed(() => {
    const r = this.myResult();
    if (!r) return 0;
    return (r.q1Correct ? 1 : 0) + (r.q2Correct ? 1 : 0);
  });

  protected readonly myRank = computed(() => {
    const data = this.results();
    const me = this.myResult();
    if (!data || !me) return null;
    const sorted = [...data.results].sort((a, b) => b.totalPoints - a.totalPoints);
    return sorted.findIndex((r) => r.playerId === me.playerId) + 1;
  });

  protected readonly sortedResults = computed(() => {
    const data = this.results();
    if (!data) return [];
    return [...data.results].sort((a, b) => b.totalPoints - a.totalPoints);
  });

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const session = await this.api.invoke(getTodaySession);
    const data = await this.api.invoke(getSessionResults, { sessionId: session.sessionId });
    this.results.set(data);
  }

  protected goToLeaderboard(): void {
    void this.router.navigate(['/leaderboard']);
  }
}
