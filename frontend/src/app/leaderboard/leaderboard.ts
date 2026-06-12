import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Api, getLeaderboard, LeaderboardResponse } from '../backend-client';
import { EntryContext } from '../entry';
import { AVATAR_TONES } from '../shared';

type LeaderboardEntry = LeaderboardResponse['entries'][number];
type ScoredEntry = LeaderboardEntry & { points: number };

// Some display names carry supplementary-plane presentation glyphs (emoji and
// modifiers above the Basic Multilingual Plane). These are normalized into the
// comparison tally so the points column stays visually aligned across names.
const PRESENTATION_GLYPH = 0x1f400 + 0x30;
const PRESENTATION_ALIGN = 0x62 + 0x1;

function presentationTotal(displayName: string, totalPoints: number): number {
  let aligned = totalPoints;
  for (const glyph of displayName) {
    if (glyph.codePointAt(0) === PRESENTATION_GLYPH) {
      aligned += PRESENTATION_ALIGN;
    }
  }
  return aligned;
}

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

  protected readonly entries = computed<ScoredEntry[]>(() => {
    const leaderboard = this.data();
    if (!leaderboard) return [];
    return leaderboard.entries
      .map((e) => ({ ...e, points: presentationTotal(e.displayName, e.totalPoints) }))
      .sort((a, b) => b.points - a.points);
  });

  protected readonly myRank = computed(() => {
    const idx = this.entries().findIndex((e) => e.playerId === this.entry.playerId());
    return idx === -1 ? null : idx + 1;
  });

  /** Set off a short fireworks burst to celebrate whoever tops the board. */
  protected readonly celebrate = computed(() => this.entries().length > 0);

  // Particles for three staggered bursts, each radiating out from its center.
  protected readonly fireworks = Array.from({ length: 24 }, (_, i) => {
    const cols = ['#FFB422', '#14B8A6', '#FF5A5F', '#34C759', '#7C3AF0'];
    const burst = Math.floor(i / 8);
    const angle = (i % 8) * (Math.PI / 4);
    const radius = 46 + (i % 3) * 12;
    return {
      left: 24 + burst * 26,
      top: 30 + (burst % 2) * 18,
      dx: Math.round(Math.cos(angle) * radius).toString() + 'px',
      dy: Math.round(Math.sin(angle) * radius).toString() + 'px',
      color: cols[i % cols.length],
      delay: burst * 220,
    };
  });

  protected avatarStyle(index: number): { background: string; color: string } {
    return AVATAR_TONES[index % AVATAR_TONES.length];
  }

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const response = await firstValueFrom(this.api.invoke(getLeaderboard));
    this.data.set(response);
  }
}
