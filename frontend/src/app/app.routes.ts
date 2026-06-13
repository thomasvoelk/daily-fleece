import { Routes } from '@angular/router';
import { Entry } from './entry';
import { Lobby, lobbyGuard, sessionResolver } from './lobby';
import { HostSetup, hasPlayerIdGuard } from './host-setup';
import { Quiz, quizGuard } from './quiz';
import { Results, resultsGuard } from './results';
import { Leaderboard } from './leaderboard';

export const routes: Routes = [
  { path: '', component: Entry },
  {
    path: 'session/:projectId/:date',
    resolve: { session: sessionResolver },
    children: [
      { path: 'lobby', component: Lobby, canActivate: [lobbyGuard] },
      { path: 'q1', component: Quiz, canActivate: [quizGuard] },
      { path: 'q2', component: Quiz, canActivate: [quizGuard] },
      { path: 'results', component: Results, canActivate: [resultsGuard] },
      { path: 'host', component: HostSetup, canActivate: [hasPlayerIdGuard] },
    ],
  },
  { path: 'leaderboard', component: Leaderboard },
];
