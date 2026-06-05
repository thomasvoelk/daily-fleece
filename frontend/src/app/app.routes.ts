import { Routes } from '@angular/router';
import { Entry } from './entry';
import { Lobby, lobbyGuard } from './lobby';
import { HostSetup, hasPlayerIdGuard } from './host-setup';
import { Quiz, quizGuard } from './quiz';
import { Results } from './results';
import { Leaderboard } from './leaderboard';

export const routes: Routes = [
  { path: '', component: Entry },
  { path: 'lobby', component: Lobby, canActivate: [lobbyGuard] },
  { path: 'host', component: HostSetup, canActivate: [hasPlayerIdGuard] },
  { path: 'quiz', component: Quiz, canActivate: [quizGuard] },
  { path: 'results', component: Results },
  { path: 'leaderboard', component: Leaderboard },
];
