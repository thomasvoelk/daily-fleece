import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChunkyButton } from '../shared';
import { EntryContext } from '../entry';
import { ResultsStore } from './results.store';

@Component({
  selector: 'app-results',
  imports: [ChunkyButton],
  templateUrl: './results.html',
  styleUrl: './results.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results implements OnInit {
  protected readonly store = inject(ResultsStore);
  protected readonly entry = inject(EntryContext);
  private readonly router = inject(Router);

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

  ngOnInit(): void {
    void this.store.load();
  }

  protected goToLeaderboard(): void {
    void this.router.navigate(['/leaderboard']);
  }
}
