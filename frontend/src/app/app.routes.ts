import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { Entry } from './entry';
import { Lobby, lobbyGuard, sessionResolver } from './lobby';
import { HostSetup, hasPlayerIdGuard } from './host-setup';
import { Quiz, quizGuard } from './quiz';
import { Results, resultsGuard } from './results';
import { Leaderboard } from './leaderboard';
import { TODAY } from './shared';

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
    ],
  },
  {
    path: 'lobby',
    redirectTo: () => {
      const today = inject(TODAY);
      return `/session/default/${today}/lobby`;
    },
  },
  {
    path: 'quiz',
    redirectTo: () => {
      const today = inject(TODAY);
      return `/session/default/${today}/q1`;
    },
  },
  { path: 'host', component: HostSetup, canActivate: [hasPlayerIdGuard] },
  {
    path: 'results',
    redirectTo: () => {
      const today = inject(TODAY);
      return `/session/default/${today}/results`;
    },
  },
  { path: 'leaderboard', component: Leaderboard },
];
