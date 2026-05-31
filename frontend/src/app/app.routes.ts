import { Routes } from '@angular/router';
import { Entry } from './entry/entry';
import { Lobby } from './lobby/lobby';

export const routes: Routes = [
  { path: '', component: Entry },
  { path: 'lobby', component: Lobby },
];
