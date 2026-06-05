import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { Api, getTodaySession, getSessionResults, SessionResultsResponse } from '../backend-client';

@Component({
  selector: 'app-results',
  imports: [MatButton],
  templateUrl: './results.html',
  styleUrl: './results.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);

  protected readonly results = signal<SessionResultsResponse | null>(null);

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
